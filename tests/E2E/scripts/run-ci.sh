#!/usr/bin/env bash

set -euo pipefail
: "${TESTRIGOR_API_KEY:?Provide the suite CI token through the environment}"
: "${TESTRIGOR_SUITE_ID:?Provide a dedicated suite ID}"
: "${E2E_BRANCH:?Provide the source branch}"
: "${E2E_COMMIT:?Provide the source commit}"

mkdir -p tests/E2E/.run
[[ "$(git rev-parse HEAD)" == "$E2E_COMMIT" ]] || { echo 'Checkout does not match the requested commit.' >&2; exit 2; }
python3 - <<'PY'
import hashlib
import json
import os
from pathlib import Path
import subprocess

root = Path('tests/E2E')
paths = [*root.glob('test-cases/*.yaml'), *root.glob('rules/*.txt'),
         root / 'settings.json', root / 'config/web-config.js', root / 'scripts/run-ci.sh',
         root / 'scripts/install-jitsi-meet.sh', root / 'docker/Dockerfile']
manifest = {
    'applicationCommit': os.environ['E2E_COMMIT'],
    'harnessCommit': os.environ['E2E_COMMIT'],
    'branch': os.environ['E2E_BRANCH'],
    'backendRelease': 'stable-11248-3',
    'mediaVerified': False,
    'remoteDefinitionScope': os.environ['E2E_BRANCH'],
    'images': {service: subprocess.check_output(
        ['docker', 'inspect', '--format', '{{.Image}}',
         os.environ.get('JITSI_E2E_PROJECT', 'jitsi-e2e') + '-' + service + '-1'], text=True).strip()
        for service in ('web', 'prosody', 'jicofo', 'jvb')},
    'fileHashes': {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}
}
(root / '.run/manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
PY

# Keep the CLI synchronous so its real exit status determines this job's result.
testrigor test-suite run "$TESTRIGOR_SUITE_ID" \
    --localhost --url https://localhost:18443/ \
    --test-cases-path 'tests/E2E/test-cases/*.yaml' \
    --rules-path 'tests/E2E/rules/*.txt' \
    --settings-path tests/E2E/settings.json \
    --labels jitsi-browser-journeys \
    --branch "$E2E_BRANCH" --commit "$E2E_COMMIT" \
    --junit-report-save-path tests/E2E/.run/junit.xml

# A successful command must cover the entire selected contribution without skips.
python3 - <<'PY'
from pathlib import Path
import xml.etree.ElementTree as ET

expected = list(Path('tests/E2E/test-cases').glob('*.yaml'))
cases = list(ET.parse('tests/E2E/.run/junit.xml').getroot().iter('testcase'))
assert len(expected) == len(cases) == 7, 'Expected exactly seven browser cases'
assert all(not any(case.find(tag) is not None for tag in ('failure', 'error', 'skipped'))
           for case in cases), 'Browser coverage contains failures, errors or skips'
identities = [case.get('name', '').removeprefix('Test Case UUID=') for case in cases]
assert all(identities) and len(set(identities)) == 7, 'Expected seven distinct case identities'
print('Verified seven passing browser cases without skips')
PY
