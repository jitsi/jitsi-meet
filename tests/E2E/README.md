# Browser E2E tests

Seven testRigor cases check participant-visible outcomes across independent browser sessions.
They share six reusable rules, create unique rooms, and leave their sessions after execution.

| Case | Assertion scope |
| --- | --- |
| TC-01 Poll votes | Changing a single-answer vote moves counts between options on both participants. |
| TC-02 Participant removal | A third participant observes removal and receives new chat in the surviving meeting. |
| TC-03 Chat edit | A peer sees replacement text and the edited marker while the old text is absent. |
| TC-04 Chat deletion | A peer sees the deletion placeholder while the deleted text is absent. |
| TC-05 Chat moderation | Only the moderator is offered removal of another participant's message; all three see the result. |
| TC-06 Participant statistics | The dialog lists participants and filters/restores them by name. |
| TC-07 Recent rooms | A recent entry rejoins a peer, and entry deletion persists in that browser only. |

Cases have the selection label `jitsi-browser-journeys`, individual `jitsi-tcNN` labels and feature labels.
Participant statistics checks read visible rows within the accessible dialog; other interactions use visible controls.
Moderation cases use three browsers and depend on the first participant receiving the moderator role.

The browser profile in `config/web-config.js` disables initial device capture, starts audio/video muted,
enables the single-answer poll control and keeps the toolbar visible. Coverage is limited to rendered UI and
signaling. Audio/video transmission, media quality and toolbar auto-hide behavior are outside this suite's scope.

## Run locally

Use Linux or WSL with Docker Compose 2.24.4 or newer, curl, flock, git, OpenSSL, Python 3, tar and
Node.js from `.nvmrc`. Create a dedicated Desktop Web Chrome/Ubuntu suite in [testRigor](https://app.testrigor.com/),
copy its ID from the suite URL and obtain its CI token from **CI/CD Integration**.

From the repository root, using a fresh runtime directory:

```bash
npm install --global @testrigor/testrigor-cli@2.0.9
export TESTRIGOR_SUITE_ID='<your-suite-id>'
read -rsp 'testRigor CI token: ' TESTRIGOR_API_KEY; echo
export TESTRIGOR_API_KEY
export E2E_BRANCH="$(git branch --show-current)"
export E2E_COMMIT="$(git rev-parse HEAD)"
export JITSI_E2E_PROJECT=jitsi-e2e
export JITSI_E2E_RUNTIME_DIR="$(mktemp -d /tmp/jitsi-e2e.XXXXXX)"

install -D -m 644 tests/E2E/config/web-config.js \
    "$JITSI_E2E_RUNTIME_DIR/config/web/custom-config.js"
bash tests/E2E/scripts/install-jitsi-meet.sh
bash tests/E2E/scripts/run-ci.sh
```

The installer builds the committed frontend with Node 24 in Docker and runs it with Docker release
`stable-11248-3` backends. Uncommitted application edits are excluded. The image label and served
`/source-revision.txt` identify the application commit. Readiness checks HTTP, the source revision and
anonymous XMPP room/chat signaling before browser execution.

The application runs locally; testRigor's cloud browsers access it through the CLI localhost tunnel.
The script uploads local definitions on `E2E_BRANCH` and runs them sequentially. Use an idle, dedicated suite;
coordinate local runs with CI because GitHub concurrency does not cover local execution.
The script fails unless exactly seven distinct JUnit cases pass with zero failures, errors or skips.
Results are in `tests/E2E/.run/junit.xml`; revisions, definition hashes and container image IDs are in
`tests/E2E/.run/manifest.json`.

To check syntax without executing browsers:

```bash
testrigor test-suite validate-syntax "$TESTRIGOR_SUITE_ID" \
    --test-cases-path 'tests/E2E/test-cases/*.yaml' \
    --rules-path 'tests/E2E/rules/*.txt' --explicit-mutations
```

### Local instance configuration

The default instance uses a self-signed HTTPS certificate and binds only loopback ports: HTTPS 18443,
HTTP 18080 and UDP 11000. The focus REST API is not published. P2P is disabled.
The installer alone does not contact testRigor. HTTP/XMPP readiness and the web tunnel do not verify
a working bridge media path; remote media testing needs separately configured UDP or TURN connectivity.

Runtime files, service passwords and source snapshots stay in ignored `.runtime/`; results stay in ignored `.run/`.
For WSL, set `JITSI_E2E_RUNTIME_DIR` to a Linux filesystem directory.
Installer inputs are `JITSI_E2E_PROJECT`, `JITSI_E2E_RUNTIME_DIR`, `JITSI_E2E_RELEASE`, `JITSI_E2E_PUBLIC_URL`,
`JITSI_E2E_ADVERTISE_IP`, `JITSI_E2E_HTTP_PORT`, `JITSI_E2E_HTTPS_PORT` and `JITSI_E2E_MEDIA_PORT`.
The browser runner uses `https://localhost:18443/`; keep that HTTPS port when using `run-ci.sh`.
Use separate runtime directories and project names for separate instances. Existing environment files are preserved.

Run `bash tests/E2E/scripts/install-jitsi-meet.sh` with `status`, `logs`, `restart` or `reset` to manage the instance.
Reset runs Compose down/up without rebuilding or deleting persistent configuration, credentials or recordings.

## Opt-in GitHub Actions

Add repository variable `TESTRIGOR_SUITE_ID` and secret `TESTRIGOR_CI_TOKEN` under
**Settings > Secrets and variables > Actions** using the dedicated suite's ID and CI token.
The workflow maps that secret to the CLI's `TESTRIGOR_API_KEY` environment variable.

Once the workflow is on the default branch, it runs for same-repository PRs targeting that branch and manual
dispatches from that branch through **Actions > Browser E2E (opt-in) > Run workflow**.
The configuration check succeeds and the browser job skips when credentials are absent or the ref is ineligible.
PRs from forks are skipped. The workflow has read-only repository permissions and records the checked-out
PR head commit, or the selected default-branch commit for manual runs.

The **Seven browser journeys** job builds the frontend, provisions the browser profile and runs the cases
using CLI 2.0.9. Definitions are scoped to the source branch. Concurrency is keyed by suite ID within the
repository and does not cancel active jobs; use separate suites across repositories.
The job timeout is 120 minutes. If interrupted, check the remote task before starting another run.

Download `jitsi-e2e-<run-id>-<attempt>` for JUnit, the manifest and sanitized failure container logs,
retained for seven days. Runtime configuration and passwords are excluded.
Remove the suite variable or CI token secret to disable browser execution.
