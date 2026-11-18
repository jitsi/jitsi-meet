#!/usr/bin/env python3
"""Remove service credentials before collecting container logs as CI artifacts."""

import os
from pathlib import Path
import sys

secrets = []
runtime = Path(os.environ['JITSI_E2E_RUNTIME_DIR'])
env_file = runtime / '.env'
if env_file.exists():
    for line in env_file.read_text(encoding='utf-8').splitlines():
        key, separator, value = line.partition('=')
        if separator and value and any(word in key.upper() for word in ('PASSWORD', 'TOKEN', 'SECRET')):
            secrets.append(value)
if os.environ.get('TESTRIGOR_API_KEY'):
    secrets.append(os.environ['TESTRIGOR_API_KEY'])
for line in sys.stdin:
    for value in sorted(secrets, key=len, reverse=True):
        line = line.replace(value, '[REDACTED]')
    sys.stdout.write(line)
