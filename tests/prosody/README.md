# Prosody Plugin Integration Tests

Integration tests for the Jitsi Prosody plugins. Tests run against a real Prosody 13 instance
inside Docker and connect to it over XMPP WebSocket and HTTP.

## Architecture and Lifecycle

One Docker container runs for the entire test suite (not per-test). The container is started
by the Mocha global setup hook (`setup.js`) using [testcontainers](https://testcontainers.com/),
and torn down after all tests complete.

```
npm test
  └─ Mocha (setup.js beforeAll)
       └─ Docker container: Prosody 13
            └─ HTTP :5280   ← test clients connect via WebSocket (/xmpp-websocket)
                            ← test assertions query HTTP endpoints here
```

Test clients are anonymous XMPP connections (`@xmpp/client`). Rooms are created by joining
them; they are automatically destroyed by Prosody when all occupants disconnect.

Because rooms live only as long as their occupants, tests are effectively isolated as long as
each test disconnects its clients in a `finally` block. Room names are unique per test (counter
suffix) so there is no cross-test interference.

## Assertion Strategies

Two complementary mechanisms are available for asserting internal Prosody state.

### Option I — `prosodyctl shell` (black-box runtime control)

`helpers/prosody_shell.js` runs Lua expressions inside the live Prosody process via
`prosodyctl shell` (executed through `docker exec`). Use this when you need to:

- Load or unload a module at runtime to test behaviour with/without it.
- Execute arbitrary Lua to inspect or mutate server state.

```js
import { prosodyShell } from './helpers/prosody_shell.js';

await prosodyShell('module:unload("muc_hide_all", "conference.localhost")');
// ... run test ...
await prosodyShell('module:load("muc_hide_all", "conference.localhost")');
```

### Option II — `mod_test_observer` HTTP endpoints (event log + room state)

`mod_test_observer.lua` (loaded on the MUC component) hooks MUC events and stores them in a
Lua shared table. `mod_test_observer_http.lua` (loaded on the main VirtualHost) serves that
shared state over plain HTTP on port 5280.

> **Why two modules?** Prosody routes HTTP by `Host` header. A module on the MUC component
> (`conference.localhost`) would only be reachable at `Host: conference.localhost`, which is
> not resolvable from the host machine. Loading the HTTP server on the main VirtualHost
> (`localhost`) makes port 5280 directly reachable. The two modules share data through
> `module:shared()`.

`helpers/test_observer.js` wraps the three endpoints:

| Endpoint | Purpose |
|---|---|
| `GET  /test-observer/events` | Return all MUC events fired since the last clear |
| `DELETE /test-observer/events` | Clear the event log (call in `beforeEach`) |
| `GET  /test-observer/rooms?jid=<room-jid>` | Return live room state: `{ jid, hidden, occupant_count }` |

```js
import { clearEvents, getEvents, getRoomState } from './helpers/test_observer.js';

beforeEach(() => clearEvents());

// Check fired events:
const events = await getEvents();
assert.ok(events.map(e => e.event).includes('muc-room-pre-create'));

// Check internal room state:
const state = await getRoomState('room@conference.localhost');
assert.equal(state.hidden, true);
```

## Directory Structure

```
tests/prosody/
├── README.md                       this file
├── setup.js                        Mocha root hooks: start/stop Docker container
├── .mocharc.cjs                    Mocha configuration (spec glob, timeout, reporters)
├── mocha-reporter-config.json      Multi-reporter config: spec + allure-mocha
├── package.json                    Node dependencies (mocha, testcontainers, @xmpp/client, allure)
│
├── docker/
│   ├── Dockerfile                  Prosody 13 image with lua-cjson + Jitsi plugins
│   ├── docker-compose.yml          Exposes :5222 (XMPP) and :5280 (HTTP)
│   └── prosody.cfg.lua             Minimal config: anonymous auth, no TLS, MUC at conference.localhost
│
├── helpers/
│   ├── container.js                Holds the testcontainers container reference (set in setup.js)
│   ├── xmpp_client.js              Creates anonymous XMPP clients with joinRoom / sendDiscoInfo
│   ├── prosody_shell.js            Runs prosodyctl shell commands inside the container (Option I)
│   └── test_observer.js            HTTP client for mod_test_observer endpoints (Option II)
│
├── lua/
│   └── jwk_spec.lua                busted unit tests for token/jwk.lib.lua (no Prosody needed)
│
├── mod_conference_duration_spec.js  Tests for mod_conference_duration
├── mod_muc_filter_access_spec.js    Tests for mod_muc_filter_access
├── mod_muc_hide_all_spec.js         Tests for mod_muc_hide_all
├── mod_muc_max_occupants_spec.js    Tests for mod_muc_max_occupants
├── mod_muc_meeting_id_spec.js       Tests for mod_muc_meeting_id
└── mod_muc_size_spec.js             Tests for mod_muc_size
```

The plugin sources under test (`mod_muc_hide_all.lua`, `mod_muc_max_occupants.lua`, etc.) live
in `resources/prosody-plugins/` and are copied into the Docker image at build time. The test
observer modules (`mod_test_observer.lua`, `mod_test_observer_http.lua`) are test-only and
should never be loaded in production.

## Running

```bash
cd tests/prosody
npm install          # first time only
npm test             # runs Lua unit tests, integration tests, and generates Allure report
```

`npm test` runs three steps in sequence:
1. `test:lua` — busted unit tests for pure Lua code (skipped gracefully if busted is not installed)
2. `test:integration` — Mocha integration tests against a Docker Prosody instance
3. `test:report` — generates `allure-report/` from both test suites

To run a single spec file with container debug output:
```bash
DEBUG=testcontainers,testcontainers:containers npm run test:one -- <spec-file>
```

To open the report after a run:
```bash
npx allure open allure-report
```

On macOS with Colima the Docker socket is not at the default path. Export it before running:

```bash
export DOCKER_HOST=unix:///Users/$(whoami)/.colima/default/docker.sock
export TESTCONTAINERS_RYUK_DISABLED=true   # Ryuk reaper fails under Colima
npm test
```
