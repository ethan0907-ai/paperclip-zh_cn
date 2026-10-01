"""Run with: python3 -B -m unittest -v test_update_paperclip.py"""
import importlib.util
import json
from pathlib import Path
import unittest
import tempfile
import subprocess
import sys
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('update-paperclip.py')
updater = None
if SCRIPT.exists():
    spec = importlib.util.spec_from_file_location('paperclip_updater', SCRIPT)
    updater = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(updater)


class UpdateTests(unittest.TestCase):
    def test_update_preserves_unpushed_local_commit(self):
        from contextlib import nullcontext
        with tempfile.TemporaryDirectory(dir=SCRIPT.parent) as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.PIPE).decode().strip()
            git('init', '-b', 'master')
            git('config', 'user.email', 'test@example.invalid')
            git('config', 'user.name', 'Test')
            git('commit', '--allow-empty', '-m', 'base')
            git('remote', 'add', 'origin', str(root))
            git('branch', 'remote-base')
            git('commit', '--allow-empty', '-m', 'local fix')
            local = git('rev-parse', 'HEAD')
            real_run = updater.run
            real_popen = subprocess.Popen
            def popen(args, **kwargs):
                if args[:2] == ['git', 'archive']:
                    self.assertEqual(args[-1], local)
                    raise RuntimeError('build boundary')
                return real_popen(args, **kwargs)
            def run(*args, **kwargs):
                if args == ('git', 'fetch', 'origin', 'master'):
                    args = ('git', 'fetch', 'origin', 'remote-base')
                return real_run(*args, **kwargs)
            info = {'app': {'Config': {'Image': 'old'}}}
            with patch.object(updater, 'ROOT', root), \
                 patch.object(updater, 'update_lock', return_value=nullcontext()), \
                 patch.object(updater, 'preflight', return_value=info), \
                 patch.object(updater, 'check_tree'), \
                 patch.object(updater, 'run', side_effect=run), \
                 patch.object(updater.subprocess, 'Popen') as archive, \
                 patch.object(updater, 'deploy') as deploy:
                # Stop before Docker; the archive must contain the local HEAD.
                archive.side_effect = popen
                with self.assertRaisesRegex(RuntimeError, 'build boundary'):
                    updater.update()
                self.assertTrue(any(c.args[0][:2] == ['git', 'archive'] for c in archive.call_args_list))
                deploy.assert_not_called()

    def test_backup_failure_restarts_old_container_without_deploying(self):
        self.assertTrue(hasattr(updater, 'deploy'), 'Deployment flow is not implemented')
        with tempfile.TemporaryDirectory(dir=SCRIPT.parent) as directory:
            root = Path(directory)
            compose = root / 'compose.server.json'
            original = b'{"services":{"paperclip":{"image":"old"}}}'
            compose.write_bytes(original)
            (root / '.env').write_text('TEST_ONLY=1\n')
            info = {'compose': original, 'app': {'Id': 'old-id', 'Image': 'old-image-id'}, 'peers': {}}
            with patch.multiple(updater, ROOT=root, BACKUPS=root / 'backups'), \
                 patch.object(updater, 'run', return_value='') as commands, \
                 patch.object(updater, 'inspect', return_value=info['app']), \
                 patch.object(updater, 'wait_healthy'), \
                 patch.object(updater, 'backup_data', side_effect=RuntimeError('backup failed')):
                with self.assertRaisesRegex(RuntimeError, 'backup failed'):
                    updater.deploy(info, 'new', 'a' * 40)
                calls = [c.args for c in commands.call_args_list]
                self.assertIn(('docker', 'start', 'old-id'), calls)
                self.assertFalse(any('up' in args for args in calls))
                self.assertFalse((updater.BACKUPS / 'pending.json').exists())
                self.assertEqual(compose.read_bytes(), original)

    def test_new_start_failure_never_starts_old_image(self):
        with tempfile.TemporaryDirectory(dir=SCRIPT.parent) as directory:
            root = Path(directory)
            original = b'{"services":{"paperclip":{"image":"old"}}}'
            (root / 'compose.server.json').write_bytes(original)
            (root / '.env').write_text('TEST_ONLY=1\n')
            info = {'compose': original, 'app': {'Id': 'old-id', 'Image': 'old-image-id'}, 'peers': {}}
            def compose(*args, **kwargs):
                if args[0] == 'up':
                    raise RuntimeError('new startup failed')
                return ''
            with patch.multiple(updater, ROOT=root, BACKUPS=root / 'backups'), \
                 patch.object(updater, 'run', return_value='') as commands, \
                 patch.object(updater, 'inspect', return_value=info['app']), \
                 patch.object(updater, 'backup_data'), \
                 patch.object(updater, 'compose', side_effect=compose) as compose_mock:
                with self.assertRaisesRegex(RuntimeError, 'new startup failed'):
                    updater.deploy(info, 'new', 'a' * 40)
                self.assertFalse(any(c.args[:2] == ('docker', 'start') for c in commands.call_args_list))
                self.assertTrue((updater.BACKUPS / 'pending.json').exists())
                self.assertEqual(json.loads((root / 'compose.server.json').read_bytes())['services']['paperclip']['image'], 'new')
                self.assertIn(('stop', '--timeout', '60', 'paperclip'), [c.args for c in compose_mock.call_args_list])

    def test_pending_marker_refuses_all_commands(self):
        with tempfile.TemporaryDirectory(dir=SCRIPT.parent) as directory:
            root = Path(directory)
            (root / 'pending.json').write_text('{}')
            with patch.object(updater, 'BACKUPS', root), patch.object(updater, 'run') as commands:
                with self.assertRaisesRegex(RuntimeError, 'Unfinished update'):
                    updater.preflight()
                commands.assert_not_called()

    def test_check_failure_does_not_update(self):
        with patch.object(updater, 'preflight', side_effect=RuntimeError('authentication missing')), \
             patch.object(updater, 'update') as update:
            self.assertEqual(updater.main(['--check']), 1)
            update.assert_not_called()

    def test_tracked_secret_env_is_rejected(self):
        for name in ['.env', '.env.production', 'sub/.env.local']:
            with patch.object(updater, 'run', return_value='Dockerfile\n' + name):
                with self.assertRaisesRegex(RuntimeError, 'environment files'):
                    updater.check_tree('HEAD')
        with patch.object(updater, 'run', return_value='Dockerfile\n.env.example\n.env.runner-e2e.example'):
            updater.check_tree('HEAD')

    def test_lock_rejects_second_process(self):
        with tempfile.TemporaryDirectory(dir=SCRIPT.parent) as directory:
            root = Path(directory)
            with patch.object(updater.Path, 'home', return_value=root), updater.update_lock():
                code = "import fcntl,sys; f=open(sys.argv[1],'a'); fcntl.flock(f,fcntl.LOCK_EX|fcntl.LOCK_NB)"
                result = subprocess.run([sys.executable, '-c', code, str(root / '.paperclip-update.lock')], capture_output=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(b'BlockingIOError', result.stderr)

    def test_atomic_write_failure_preserves_original(self):
        self.assertTrue(hasattr(updater, 'atomic_write'), 'Atomic write is not implemented')
        with tempfile.TemporaryDirectory(dir=SCRIPT.parent) as directory:
            target = Path(directory) / 'compose.json'
            target.write_bytes(b'original')
            with patch.object(updater.os, 'replace', side_effect=OSError('interrupted')):
                with self.assertRaises(OSError):
                    updater.atomic_write(target, b'new')
            self.assertEqual(target.read_bytes(), b'original')
            self.assertEqual(list(Path(directory).iterdir()), [target])
            updater.atomic_write(target, b'new')
            self.assertEqual(target.read_bytes(), b'new')

    def test_image_change_preserves_gateway_and_all_other_fields(self):
        self.assertIsNotNone(updater, 'Update script has not been implemented')
        original = {
            'services': {
                'paperclip': {'image': 'magic-paperclip:old',
                              'networks': {'workspace': {'gw_priority': 1}, 'ai-net': {}},
                              'environment': {'NODE_EXTRA_CA_CERTS': '/ca.crt'},
                              'volumes': ['data:/paperclip', '/ca.crt:/ca.crt:ro']},
                'hermes-tls': {'network_mode': 'container:hermes-business'},
            },
            'volumes': {'data': {}},
            'networks': {'workspace': {'external': True}, 'ai-net': {'external': True}},
        }
        changed = json.loads(updater.replace_image(json.dumps(original).encode(), 'magic-paperclip:new'))
        self.assertEqual(changed['services']['paperclip']['image'], 'magic-paperclip:new')
        changed['services']['paperclip']['image'] = 'magic-paperclip:old'
        self.assertEqual(changed, original)


if __name__ == '__main__':
    unittest.main()
