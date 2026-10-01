import json, re, subprocess
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError
base = 'http://192.168.50.60:3100'
health = json.load(urlopen(base + '/api/health', timeout=15))
assert health['status'] == 'ok' and health['deploymentMode'] == 'authenticated'
html = urlopen(base, timeout=15).read().decode()
assets = set(re.findall(r'(?:src|href)="(/assets/[^\"]+)"', html))
assert assets
for path in assets:
    r = urlopen(base + path, timeout=15)
    assert r.status == 200 and 'text/html' not in r.headers.get('Content-Type', '')
try:
    urlopen(base + '/api/companies', timeout=15)
    raise AssertionError('Anonymous API allowed')
except HTTPError as e:
    assert e.code in (401, 403)
assert urlopen(base + '/auth', timeout=15).status == 200
container = json.loads(subprocess.check_output(['docker', 'inspect', 'paperclip']))[0]
assert container['State']['Health']['Status'] == 'healthy'
assert container['HostConfig']['RestartPolicy']['Name'] == 'unless-stopped'
assert any(m['Destination'] == '/paperclip' and m['Type'] == 'volume' for m in container['Mounts'])
assert container['HostConfig']['PortBindings']['3100/tcp'][0]['HostIp'] == '192.168.50.60'
pg = json.loads(subprocess.check_output(['docker', 'inspect', 'postgres']))[0]
admin = next(x.split('=',1)[1] for x in pg['Config']['Env'] if x.startswith('POSTGRES_USER='))
sql = "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'; SELECT count(*) FROM drizzle.__drizzle_migrations;"
counts = subprocess.check_output(['docker','exec','postgres','psql','-U',admin,'-d','paperclip','-Atc',sql], text=True).splitlines()
assert all(int(n) > 0 for n in counts)
old_ids = Path('/home/magic88ai/workspace/paperclip/.git/deploy/preexisting-containers.json').read_text().splitlines()
for cid in old_ids:
    old = json.loads(subprocess.check_output(['docker', 'inspect', cid]))[0]
    assert old['State']['Running'], old['Name']
print(json.dumps({'container':'healthy','assets_checked':len(assets),'public_tables':int(counts[0]),'migrations':int(counts[1]),'anonymous_api':'denied','existing_containers':'running','bootstrap':health['bootstrapStatus'],'warnings':health.get('warnings',[])},ensure_ascii=False))
