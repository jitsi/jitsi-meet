# Malleus Jitsificus

The jitsi-meet load tester: it fills one or more conferences on a deployment with browser-driven participants for
a while and reports whether they all made it. It reuses the regular WebdriverIO test suite (Chrome setup, grid
support, `Participant`, browser logs) but is not part of the regular runs.

## Running

Install the tests' dependencies once (`npm install` in this directory), then:

```
npm run malleus -- --instance-url=https://meet.example.com/ --participants=20 --senders=5 --duration=300
npm run malleus -- --help
```

Every flag maps onto an environment variable (see `--help` and `env.example`), so a run can also be configured
in `.env`; a flag wins over the environment. The regular suite's settings apply too: `BASE_URL`, `GRID_HOST_URL`,
`HEADLESS`, `ALLOW_INSECURE_CERTS`, `VIDEO_CAPTURE_FILE`, `ROOM_NAME_PREFIX`, `ROOM_NAME_SUFFIX`. Room names are
built as `<prefix><conference index><suffix>`, with the suffix last so that infrastructure which pins a room to a
release by a shard name at the end of the room name keeps working; a comma-separated `ROOM_NAME_SUFFIX`
(`--room-name-suffix=a,b`) spreads the conferences over the suffixes.

`scripts/malleus.sh` forwards its arguments to `npm run malleus`, for callers that expect a shell script.

## What a run does

- `--conferences` conferences run in parallel, each with `--participants` participants. The first `--senders` send
  video, the rest join video muted; `--audio-senders` of them send audio, the rest never do GUM.
- Participants join `--join-delay` milliseconds apart, stay `--duration` seconds and hang up. Any participant that
  fails to join (or, when bridges are disrupted, to stay connected) fails the run, after everybody has been given
  the chance to finish.
- `--switch-speakers` mutes and unmutes the audio senders following the ITU-T P.59 conversation model.
- `--max-disrupted-bridges-pct` collects the bridges the participants land on and hands that percentage of them to
  the blip script (`scripts/blip.sh`, a placeholder to replace with one for your infrastructure, or
  `--blip-script`), then checks the participants stay or get back connected.
- Participants join with `--jwt` if given; otherwise, when the suite's JaaS key is configured (`JAAS_KID`,
  `JAAS_PRIVATE_KEY_PATH`, `JAAS_TENANT`), each participant gets its own freshly minted JaaS token, so
  tenant deployments that require tokens work out of the box. The tokens are moderator tokens so that a lobby
  does not hold the participants back (`--jaas-moderator=false` to change that); `--generate-jaas-tokens=false`
  turns the minting off.
- `--regions` assigns `config.deploymentInfo.userRegion` values round robin; `--extra-sender-params` and
  `--extra-receiver-params` append raw `config.x=y` URL parameters; `--use-stage-view` disables tile view.

## Load-test mode

`--use-load-test` replaces the full application with the lightweight client in `react/features/load-test`, which
only uses lib-jitsi-meet and can run several participants per tab (`--senders-per-tab`, `--receivers-per-tab`)
and several tabs per browser (`--sender-tabs-per-browser`, `--receiver-tabs-per-browser`). Nothing has to be
installed on the deployment: the client is uploaded into each browser together with `resources/loadTest.html`,
which loads `config.js` and lib-jitsi-meet from the deployment under test. `--use-lite-mode` makes the receivers
run lib-jitsi-meet in lite mode.

The client bundle is built with `npm run build:load-test` at the repository root (into
`build/load-test-participant.min.js`); the CLI builds it when it is missing. `--load-test-bundle` points at a
build elsewhere, for machines that only have `tests/` installed. The bundle is deliberately not part of the
deployed application.

Since the client runs from a `file://` page, deployments that only offer BOSH need CORS headers on `/http-bind`;
WebSocket, the default on modern deployments, has no such restriction.

## Grid

`--hub-url` runs the browsers on a Selenium Grid. With `--use-node-types` the browsers of video senders (which
need CPU) request the capability `nodename:applicationName` = `malleusSender` and all the others `malleusReceiver`,
so that the two can be routed to differently sized node pools. The grid has to declare those values in the
stereotypes of the nodes meant for each role; nothing on the grid is changed by a run.

## Layout

- `cli.ts`: the command line, flags to environment, builds the bundle, then runs wdio.
- `../wdio.malleus.conf.ts`: the wdio config, generating one browser session per `layoutBrowsers()` entry.
- `malleus.spec.ts`: the single spec: one async task per conference.
- `MalleusConfig.ts`: settings, validation and the participant / browser layout.
- `MalleusParticipant.ts`: one participant's lifecycle (offset, join, health check, hang up).
- `TabbedSession.ts`: several participants per browser session, one per tab.
- `speakers.ts`, `blip.ts`: speaker switching and bridge disruption.
