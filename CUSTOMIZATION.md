# Fishmeet Customization Guide

## Engineering Goal

Keep jitsi-meet core files as close to `gracetech_master` as possible so that
upstream jitsi updates can be pulled in at low cost. All fishmeet-specific
customizations should live under `fishmeet/` and be applied at build time via
`rsync`, not baked into core files.

---

## The Override Mechanism

Before building, the build scripts run:

```bash
rsync -r fishmeet/react/ react/
```

This overlays `fishmeet/react/` on top of `react/`, replacing any file that
exists in both. The core `react/` tree is never modified by hand — only the
files under `fishmeet/react/` are fishmeet-specific.

### Build Scripts

| Script | Purpose |
|--------|---------|
| `./build.fishmeet.sh` | Web build — applies `fishmeet/react/` and `fishmeet/css/` overrides, then runs `make` |
| `./build.fishmeet-rnsdk.sh` | React Native SDK build — applies `fishmeet/react/` overrides, then runs `npm pack` inside `react-native-sdk/` |

---

## Local Development with `./dev.sh`

`./dev.sh` is the entry point for running the web app locally. It applies the
fishmeet overrides and then starts the webpack dev server pointed at a chosen
backend.

### What it does

1. **Copies fishmeet overrides** into the working tree:
   ```bash
   cp fishmeet/css/_*.scss css/
   rsync -r fishmeet/react/ react/
   ```
2. **Copies backend-specific local config** from `fishmeet/local/pointing2*/`
   into the project root (overwrites `index.html` and the local config JS).
3. **Runs `make dev`** (webpack dev server with hot reload).

### Usage

```bash
./dev.sh
```

An interactive menu appears:

```
================================
    Backend Selection Menu
================================
1. Against Fishmeet Backend
2. Against Jitsi Backend
3. Against Localhost Backend
4. Exit
================================
```

| Option | Backend target | Local config applied |
|--------|---------------|----------------------|
| 1 | `https://m.fishmeet.top` | `fishmeet/local/pointing2fishmeetOnline/` |
| 2 | Jitsi (alpha.jitsi.net) | `fishmeet/local/pointing2jitsi/` |
| 3 | Localhost | `fishmeet/local/pointing2localhost/` |

Pick the option that matches the backend you want to test against, then open
`https://localhost:8080` in a browser.

### Adding a new backend config

1. Create a subdirectory under `fishmeet/local/`, e.g. `pointing2staging/`.
2. Add an `index.html` (copy from an existing `pointing2*/` dir) and a JS
   config file (e.g. `staging.js`) that sets `var config = { ... }` for
   that environment.
3. Add a new script under `fishmeet/scripts/`, e.g. `staging_backend.sh`:
   ```bash
   export WEBPACK_DEV_SERVER_PROXY_TARGET='https://your-staging-host'
   cp fishmeet/local/*.* .
   cp fishmeet/local/pointing2staging/index.html .
   make dev
   export WEBPACK_DEV_SERVER_PROXY_TARGET=
   ```
4. Add a menu entry in `dev.sh` following the existing `case` block pattern.

### Important: overrides are applied once at startup

`dev.sh` runs the rsync/copy **before** starting the dev server. If you edit a
file under `fishmeet/react/` or `fishmeet/css/` while the dev server is
running, the change will **not** be picked up automatically — you need to
restart `dev.sh`. Changes directly to `react/` or `css/` are picked up by
webpack hot reload as normal, but remember those edits will be overwritten the
next time `dev.sh` (or a build script) runs the rsync step.

---

## What Lives Where

### `fishmeet/react/` — Override files (the preferred place for all customizations)

Mirroring the structure of `react/`, every file here replaces its counterpart
in `react/` after rsync. The key categories:

#### Design tokens / palette
`fishmeet/react/features/base/ui/Tokens.ts`
Overrides `BaseTheme.palette` to inject fishmeet brand colors
(`fishMeetUiBackground`, `fishMeetMainColor02`, `fishMeetText03`, etc.).
This is the **single source of truth** for all brand colors — reference palette
tokens in stylesheets rather than hardcoding hex values.

#### Stylesheets (`styles.ts` overrides)
Full replacements of the corresponding `react/.../styles.ts` files with
fishmeet-specific values. Changed properties are annotated with
`// fishmeet: was <original value>` comments for easy diffing on upgrade.

| Override file | What it customizes |
|---|---|
| `fishmeet/react/features/base/react/components/native/styles.ts` | Base container/avatar styles |
| `fishmeet/react/features/base/ui/components/native/buttonStyles.ts` | Button type configs (color, label, disabled states) |
| `fishmeet/react/features/chat/components/native/styles.ts` | Chat screen layout and input field |
| `fishmeet/react/features/conference/components/native/styles.ts` | In-call screen layout, title bar |
| `fishmeet/react/features/participants-pane/components/native/styles.ts` | Participants pane layout and search input |
| `fishmeet/react/features/polls/components/native/styles.ts` | Poll answer row and switch styling |
| `fishmeet/react/features/toolbox/components/native/styles.ts` | Toolbox button ColorScheme overrides |
| `fishmeet/react/features/toolbox/components/native/fishMeetStyles.ts` | Toolbox container/pill layout styles |

#### Constants overrides
`fishmeet/react/features/participants-pane/constants.tsx`
Replaces `AudioStateIcons` and `VideoStateIcons` with fishmeet circular icon
containers (37×37 px, `fishMeetMainColor02` background).

#### Navigation overrides
| Override file | What it customizes |
|---|---|
| `fishmeet/react/features/mobile/navigation/screenOptions.ts` | Tab bar colors, chat/participants screen options |
| `fishmeet/react/features/mobile/navigation/fishMeetHeaderOptions.tsx` | Custom rounded header (close button, centered title) |
| `fishmeet/react/features/mobile/navigation/components/conference/components/fishMeetNavigationStyles.ts` | Header view styles |
| `fishmeet/react/features/mobile/navigation/routes.ts` | Adds `fishMeetBreakoutRooms` route |

#### Component overrides (full tsx replacements)
Used when structural differences are too large for a stylesheet-only fix.
Keep these to a minimum — each tsx override is a maintenance liability.

| Override file | What it replaces | Why a tsx override was needed |
|---|---|---|
| `fishmeet/react/features/toolbox/components/native/Toolbox.tsx` | Core `Toolbox.tsx` | Fishmeet uses a fixed pill-shaped layout (audio, video, remote-video toggle, chat, raise hand) instead of the configurable dynamic button list |
| `fishmeet/react/features/toolbox/components/native/ToggleVideoStreamButton.tsx` | *(new, no core equivalent)* | Native wrapper for `AbstractToggleVideoStreamButton`; wires `toggleVideoStream` action to a pill button that sets `lastN=0` when off |
| `fishmeet/react/features/conference/components/native/TitleBar.tsx` | Core `TitleBar.tsx` | Custom title bar layout with fishmeet buttons |
| `fishmeet/react/features/participants-pane/components/native/ParticipantsPaneFooter.tsx` | Core `ParticipantsPaneFooter.tsx` | Fishmeet breakout rooms navigation replaces standard footer |
| `fishmeet/react/features/toolbox/functions.native.ts` | Core `functions.native.ts` | Adds `getMovableButtons` (width-based button visibility for the fishmeet pill toolbox) |

#### SVG icon overrides
`fishmeet/react/features/base/icons/svg/` contains fishmeet-branded SVG
replacements for standard jitsi icons (mic, video, hangup, send, etc.) plus
fishmeet-only icons (breakout room, participant select/unselect, AV settings).

---

### `fishmeet/css/` — Web stylesheet overrides

SCSS partials (prefixed `_`) copied over `css/` before the web build.

---

## Accepted Changes to Core `react/` Files

The following are the **only** modifications made directly to core jitsi files.
Each was accepted because it was too small to justify a full file override, or
because it enables a general extension point useful beyond fishmeet.

| File | Change | Rationale |
|---|---|---|
| `react/features/base/ui/components/native/Button.tsx` | Read optional `styles.buttonTypeConfig` for per-type overrides | Enables stylesheet-driven button customization without tsx override |
| `react/features/base/ui/components/native/IconButton.tsx` | Read optional `styles.iconButtonTypeConfig` for per-type overrides | Same as above for icon buttons |
| `react/features/chat/components/native/ChatInputBar.tsx` | Pass `styles.customInput` and spread `styles.sendButtonProps` | Allows chat input field and send button styling via stylesheet override |
| `react/features/conference/components/native/Conference.tsx` | Read `styles.displayNameProps` for display name visibility/layout | Allows stylesheet to control display name behavior |
| `react/features/participants-pane/components/native/ParticipantItem.tsx` | Avatar `size` 32→50, `numberOfLines` 1→2 | Visual change small enough to keep inline |
| `react/features/polls/components/native/PollAnswer.tsx` | Spread `pollsStyles.switchProps` onto `<Switch>` | Allows Switch styling via stylesheet override |
| `react/features/video-layout/functions.any.ts` | `enableTileViewOneOnOne` config guard on `participantCount < 3` | Server-config-driven; guarded by `navigator.product === 'ReactNative'` so web is unaffected |
| `react/features/base/config/configType.ts` | Added `enableTileViewOneOnOne?: boolean` | Type definition for the above config property |
| `config.js` | `enableTileViewOneOnOne: true` | Enables tile view in 1-on-1 calls on mobile for fishmeet server |
| `tsconfig.json` / `tsconfig.native.json` / `tsconfig.web.json` | Include `fishmeet/react/features/**` | Type-checks fishmeet override files as part of the project |

The pattern used in Button, IconButton, ChatInputBar, Conference, and
PollAnswer is: **read an optional property from the stylesheet via
`(styles as any).propName`**. If the property is absent (as it is in core
jitsi), behavior is unchanged. If it is present (set in a fishmeet stylesheet
override), the fishmeet customization applies. This keeps the extension point
generic and the core change minimal.

---

## Upgrade Playbook

When pulling a new version of jitsi-meet upstream:

1. **Merge core files first.** The files listed in the table above are the
   only ones that differ from upstream. Merge each diff carefully — they are
   all small.

2. **Check `fishmeet/react/` stylesheet overrides.** Each override is a full
   copy of the upstream file with specific properties changed and annotated
   with `// fishmeet: was <original>`. On upgrade, copy the new upstream file
   into `fishmeet/react/`, then re-apply only the annotated lines.

3. **Check tsx overrides.** The four tsx overrides (`Toolbox.tsx`,
   `TitleBar.tsx`, `ParticipantsPaneFooter.tsx`, `functions.native.ts`) are
   standalone fishmeet implementations. Review the upstream changes to the
   corresponding original files and assess whether any new capabilities need
   to be reflected in the fishmeet versions.

4. **Check `Tokens.ts`.** Verify no new palette tokens were added upstream
   that the fishmeet override should supply a value for.

5. **Run lint and type-check:**
   ```bash
   npm run lint:ci
   npm run tsc:ci
   ```

---

## Decision Guide: Where Should a New Customization Go?

```
Is it purely a color, spacing, or style value?
  └─ YES → fishmeet/react/.../styles.ts override (preferred)

Is it an icon?
  └─ YES → fishmeet/react/features/base/icons/svg/ replacement

Is it a config flag that the jitsi server can serve?
  └─ YES → config.js + configType.ts (one-liner, server-controlled)

Does the core component already read an optional styles property
(buttonTypeConfig, switchProps, sendButtonProps, displayNameProps)?
  └─ YES → set that property in the fishmeet styles override

Can you add a small optional styles property to the core component
so the override can drive the behavior?
  └─ YES → add it (follow the (styles as any).propName pattern),
            set it in the fishmeet styles override

Is the structural difference so large that none of the above work?
  └─ Consider cutting the customization to avoid a tsx override.
     A tsx override is a maintenance liability on every upgrade.
     If it is truly necessary, create fishmeet/react/.../Component.tsx.
```

---

## What Not to Do

- **Do not** add `if (appType.isFishMeet)` or similar brand checks to core
  files. This was the previous pattern and has been fully removed.
- **Do not** create fishmeet-specific files (e.g. `ComponentFishMeet.tsx`)
  inside `react/`. They belong under `fishmeet/react/`.
- **Do not** edit `fishmeet/react/` files during a jitsi upgrade — only edit
  them when intentionally changing fishmeet behavior.
- **Do not** hardcode hex color values in fishmeet stylesheets. Reference
  `BaseTheme.palette.fishMeet*` tokens defined in `fishmeet/Tokens.ts`.
