#!/usr/bin/env python3
"""Paperclip Docker updater for this server (Python standard library only).

./update-paperclip.py --check   Read-only checks, including Git and a DB dump to /dev/null.
./update-paperclip.py           Confirm, build, stop Paperclip, back up, update, verify.
./update-paperclip.py --yes     Same update without the confirmation prompt.

Backups: ~/paperclip-backups/<UTC timestamp>/ (private; includes .env and secrets).
No pruning, no Git commits, no Hermes/Postgres/proxy restarts. Run when agents are idle.
A failed backup restarts the unchanged old container. Once new startup was attempted,
DB migrations may have run: stop Paperclip and require manual recovery, never blindly
roll back just the image. pending.json blocks reruns after interruption/kill -9.
"""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
BACKUPS = Path.home() / 'paperclip-backups'
PEERS = ('hermes-business', 'paperclip-hermes-tls', 'postgres')


def atomic_write(path, data):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.' + path.name)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def replace_image(original, image):
    config = json.loads(original)
    config['services']['paperclip']['image'] = image
    return (json.dumps(config, indent=2) + '\n').encode()


def run(*args, timeout=60, input=None, stdin=None, stdout=subprocess.PIPE):
    result = subprocess.run(args, cwd=ROOT, input=input, stdin=stdin, stdout=stdout,
                            stderr=subprocess.PIPE, timeout=timeout,
                            env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'})
    if result.returncode:
        # Do not echo credentials from Git URLs, container env or command output.
        raise RuntimeError(f'{args[0]} {args[1]} failed (exit {result.returncode}); check access/configuration')
    return result.stdout.decode().strip() if result.stdout is not None else ''


def inspect(name):
    return json.loads(run('docker', 'inspect', name))[0]


def compose(*args, timeout=240):
    return run('docker', 'compose', '-f', str(ROOT / 'compose.server.json'), *args, timeout=timeout)


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def check_tree(ref):
    files = run('git', 'ls-tree', '-r', '--name-only', ref).splitlines()
    bad = [name for name in files if
           (Path(name).name == '.env' or Path(name).name.startswith('.env.'))
           and not Path(name).name.endswith(('.example', '.template', '.sample'))]
    require(not bad, 'Refusing build: real environment files are tracked in the target commit')
    require('Dockerfile' in files, 'Target commit has no Dockerfile')


def wait_healthy():
    for _ in range(90):
        app = inspect('paperclip')
        if app['State'].get('Health', {}).get('Status') == 'healthy':
            return
        time.sleep(2)
    raise RuntimeError('Paperclip did not become healthy within 180 seconds')


def verify_gateway():
    key = run('docker', 'exec', 'hermes-business', 'python', '-c',
              'from dotenv import dotenv_values; print(dotenv_values("/opt/data/.env")["API_SERVER_KEY"], end="")')
    code = '''const fs=require('node:fs');
const key=fs.readFileSync(0,'utf8');
(async()=>{for(const [token,status] of [[key,200],['invalid-update-check-key',401]]){
 const r=await fetch('https://hermes-business:8643/v1/capabilities',{
 headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(5000)});
 if(r.status!==status)throw new Error('Gateway status '+r.status);
} console.log('Hermes HTTPS/auth OK');})().catch(e=>{console.error(e.message);process.exit(1)});'''
    print(run('docker', 'exec', '-i', 'paperclip', 'node', '-e', code, input=key.encode()), flush=True)


def preflight():
    require(not (BACKUPS / 'pending.json').exists(), f'Unfinished update: inspect {BACKUPS}/pending.json before rerunning')
    require(run('git', 'branch', '--show-current') == 'master', 'Switch to master first')
    require(not run('git', 'status', '--porcelain', '--untracked-files=no'), 'Tracked files are modified; refusing update')
    check_tree('HEAD')
    compose('config', '--quiet')
    config = (ROOT / 'compose.server.json').read_bytes()
    service = json.loads(config)['services']['paperclip']
    app = inspect('paperclip')
    require(app['State'].get('Health', {}).get('Status') == 'healthy', 'Current Paperclip must be healthy')
    require(app['Config']['Image'] == service['image'], 'Compose image differs from the running image')
    require(set(app['NetworkSettings']['Networks']) == {'workspace', 'ai-net'}, 'Unexpected Paperclip networks')
    env = dict(item.split('=', 1) for item in app['Config']['Env'])
    database = urlsplit(env.get('DATABASE_URL', ''))
    require(database.hostname == 'postgres' and database.path == '/paperclip' and database.port in (None, 5432), 'Unexpected database target')
    require(env.get('NODE_EXTRA_CA_CERTS') and env.get('NODE_TLS_REJECT_UNAUTHORIZED') != '0', 'TLS trust configuration missing/unsafe')
    mounts = [m for m in app['Mounts'] if m['Destination'] == '/paperclip' and m['Type'] == 'volume']
    require(len(mounts) == 1, 'Expected one persistent /paperclip volume')
    peers = {name: inspect(name) for name in PEERS}
    require(all(p['State']['Running'] for p in peers.values()), 'A dependency is stopped')
    pg_env = dict(item.split('=', 1) for item in peers['postgres']['Config']['Env'])
    pg_user = pg_env.get('POSTGRES_USER', 'postgres')
    run('docker', 'exec', 'postgres', 'pg_isready', '-U', pg_user, '-d', 'paperclip')
    run('docker', 'exec', 'postgres', 'pg_dump', '-U', pg_user, '-d', 'paperclip', '-Fc', stdout=subprocess.DEVNULL, timeout=300)
    verify_gateway()
    remote = run('git', 'ls-remote', '--exit-code', 'origin', 'refs/heads/master', timeout=30).split()[0]
    require(re.fullmatch(r'[0-9a-f]{40}', remote) is not None, 'Invalid remote commit')
    print(f'Checks passed. Current: {service["image"]}; remote master: {remote[:12]}', flush=True)
    return {'compose': config, 'app': app, 'volume': mounts[0]['Name'], 'pg_user': pg_user, 'peers': peers}


@contextmanager
def update_lock():
    # One server deployment; use a per-project lock if this script is generalized.
    with (Path.home() / '.paperclip-update.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('Another Paperclip update is running') from None
        yield


def backup_data(info, directory):
    dump = directory / 'database.dump.partial'
    with dump.open('wb') as stream:
        run('docker', 'exec', 'postgres', 'pg_dump', '-U', info['pg_user'], '-d', 'paperclip', '-Fc', stdout=stream, timeout=600)
    with dump.open('rb') as stream:
        run('docker', 'exec', '-i', 'postgres', 'pg_restore', '--list', stdin=stream, stdout=subprocess.DEVNULL)
    dump.rename(directory / 'database.dump')
    archive = directory / 'volume.tar.gz.partial'
    with archive.open('wb') as stream:
        run('docker', 'run', '--rm', '--pull', 'never', '--network', 'none', '--user', '0:0',
            '--mount', f'type=volume,source={info["volume"]},target=/data,readonly',
            '--entrypoint', 'tar', info['app']['Image'], '-czf', '-', '-C', '/data', '.', stdout=stream, timeout=600)
    run('tar', '-tzf', str(archive), stdout=subprocess.DEVNULL, timeout=600)
    archive.rename(directory / 'volume.tar.gz')
    atomic_write(directory / 'backup.complete.json', json.dumps({
        'old_image': info['app']['Config']['Image'], 'old_image_id': info['app']['Image'],
        'volume': info['volume'], 'database': 'paperclip', 'pg_user': info['pg_user'],
        'validation': 'pg_restore --list and tar -tzf; not a restore rehearsal',
    }, indent=2).encode())


def deploy(info, image, commit):
    original = info['compose']
    target = ROOT / 'compose.server.json'
    require(target.read_bytes() == original, 'Compose changed during the build')
    require(inspect('paperclip')['Id'] == info['app']['Id'], 'Paperclip changed during the build')
    BACKUPS.mkdir(mode=0o700, exist_ok=True)
    BACKUPS.chmod(0o700)
    require(not (BACKUPS / 'pending.json').exists(), 'Unfinished update marker exists')
    directory = BACKUPS / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
    directory.mkdir(mode=0o700)
    atomic_write(directory / 'compose.server.json', original)
    atomic_write(directory / '.env', (ROOT / '.env').read_bytes())
    atomic_write(directory / 'RECOVERY.txt', (
        'Do not treat .partial files as backups. Require backup.complete.json.\n'
        'After new startup, do not blindly roll back only the image: DB may be migrated.\n'
        'Manual recovery: stop ONLY paperclip; verify database.dump and volume.tar.gz;\n'
        'restore ONLY the paperclip database and its /paperclip volume using the saved\n'
        'old image ID and pg_user in backup.complete.json; restore saved Compose/.env;\n'
        'then docker compose -f compose.server.json up -d --no-deps paperclip.\n'
        'Database/volume restore overwrites data: obtain operator confirmation first.\n'
        'Never drop other databases or stop shared Postgres/Hermes.\n'
        'After manual verification, remove the parent pending.json to allow updates.\n'
    ).encode())
    marker = BACKUPS / 'pending.json'
    state = {'backup_dir': str(directory), 'phase': 'stopping', 'pid': os.getpid(),
             'started_at': datetime.now(timezone.utc).isoformat(), 'commit': commit}
    atomic_write(marker, json.dumps(state).encode())
    launched = False
    changed = replace_image(original, image)
    print(f'Backup directory: {directory}; stopping ONLY Paperclip', flush=True)
    try:
        run('docker', 'stop', '--time', '60', info['app']['Id'], timeout=90)
        backup_data(info, directory)
        require(target.read_bytes() == original, 'Compose changed during backup')
        atomic_write(target, changed)
        compose('config', '--quiet')
        state['phase'] = 'starting-new-image'
        atomic_write(marker, json.dumps(state).encode())
        launched = True  # Once attempted, even an interrupted startup could migrate the DB.
        compose('up', '-d', '--no-deps', '--pull', 'never', '--wait', '--wait-timeout', '180', 'paperclip')
        verify_release(info, commit)
        state['phase'] = 'complete'
        atomic_write(directory / 'result.json', json.dumps(state).encode())
        marker.unlink()
        print(f'Updated successfully: {image}; backup: {directory}', flush=True)
    except (Exception, KeyboardInterrupt):
        if launched:
            compose('stop', '--timeout', '60', 'paperclip')
            print(f'New startup was attempted. Paperclip stopped; no unsafe auto-rollback. Read {directory}/RECOVERY.txt', file=sys.stderr)
        else:
            current = inspect('paperclip')
            require(current['Id'] == info['app']['Id'] and current['Image'] == info['app']['Image'], 'Old container identity changed; recovery requires an operator')
            require(target.read_bytes() in (original, changed), 'Compose changed externally; refusing overwrite')
            if target.read_bytes() != original:
                atomic_write(target, original)
            run('docker', 'start', info['app']['Id'])
            wait_healthy()
            marker.unlink()
            print('Backup/pre-start failure: unchanged old Paperclip restarted and healthy.', file=sys.stderr)
        raise


def verify_release(info, commit):
    wait_healthy()
    health = json.loads(run('docker', 'exec', 'paperclip', 'curl', '-fsS', 'http://127.0.0.1:3100/api/health'))
    require(health.get('status') == 'ok' and health.get('commit') == commit, 'New build identity/health check failed')
    verify_gateway()
    app = inspect('paperclip')
    require(set(app['NetworkSettings']['Networks']) == {'workspace', 'ai-net'}, 'Paperclip lost a network')
    for name, old in info['peers'].items():
        new = inspect(name)
        require(new['Id'] == old['Id'] and new['State']['StartedAt'] == old['State']['StartedAt'] and new['State']['Running'], f'{name} was changed/stopped')
    print(f'Verified commit {commit}; dependencies unchanged; warnings: {health.get("warnings", [])}', flush=True)


def update():
    with update_lock():
        info = preflight()
        run('git', 'fetch', 'origin', 'master', timeout=120)
        commit = run('git', 'rev-parse', 'FETCH_HEAD')
        require(re.fullmatch(r'[0-9a-f]{40}', commit) is not None, 'Invalid fetched commit')
        run('git', 'merge-base', '--is-ancestor', 'HEAD', commit)
        check_tree(commit)
        run('git', 'merge', '--ff-only', commit)
        image = 'magic-paperclip:' + commit[:7]
        if info['app']['Config']['Image'] == image:
            print(f'Already running {image}; nothing to do.', flush=True)
            return
        print(f'Building {image}; existing service remains online.', flush=True)
        # Archive only tracked source, never the deployment .env, backups or live data.
        with subprocess.Popen(['git', 'archive', '--format=tar', commit], cwd=ROOT, stdout=subprocess.PIPE) as archive:
            result = subprocess.run(['docker', 'build', '--target', 'production',
                '--build-arg', 'PAPERCLIP_BUILD_COMMIT=' + commit, '-t', image, '-'],
                cwd=ROOT, stdin=archive.stdout, timeout=3600)
            archive.stdout.close()
            require(result.returncode == 0 and archive.wait() == 0, 'Build failed; production was not stopped')
        deploy(info, image, commit)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='Read-only readiness checks; no update')
    parser.add_argument('--yes', action='store_true', help='Confirm the real update noninteractively')
    args = parser.parse_args(argv)
    try:
        if args.check:
            preflight()
        elif args.yes or input('Update Paperclip with backup and brief downtime? Type YES: ').strip() == 'YES':
            os.umask(0o077)
            update()
        else:
            print('Cancelled; no changes.')
        return 0
    except (Exception, KeyboardInterrupt) as error:
        print(f'UPDATE STOPPED: {error or "interrupted"}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    sys.exit(main())
