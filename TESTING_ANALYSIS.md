# Jitsi Meet - Comprehensive Testing Analysis Report

> **Repository:** [https://github.com/Aaravanand00/jitsi-meet.git](https://github.com/Aaravanand00/jitsi-meet.git)  
> **Report Date:** 2026-09-29  
> **Audited Modules:** Web Frontend (`react/`), E2E Test Suite (`tests/`), Prosody Plugin Tests (`tests/prosody/`), Mobile (`react-native-sdk/`, `android/`, `ios/`), CI/CD (`.github/workflows/`)

---

## 1. Executive Summary

Jitsi Meet ek bohot bada, complex real-time WebRTC video conferencing application hai jisme 87 se zyada features hain. Is codebase ke testing architecture ka deep analysis karne par ek bohot bada **"Inverted Testing Pyramid" (Ice Cream Cone Anti-Pattern)** dekhne ko milta hai:

1. **Zero Frontend Unit Tests:** Pure `react/` frontend (87 feature modules aur 42 base modules) ke paas **ek bhi unit test nahi hai** (`0` Jest/Vitest files).
2. **Heavy E2E Dependency:** Testing sirf WebdriverIO based E2E tests (`tests/specs/`) par nirbhar karti hai, jinko run karne ke liye ek active live server (`alpha.jitsi.net` ya local docker) chahiye hota hai.
3. **Root Project Disconnect:** Root `package.json` me koi `"test"` script hi nahi hai. Agar koi developer root me `npm test` chalata hai toh error aata hai.
4. **Existing Tests me Critical Flaws:** Existing E2E tests me **Silent Passes** (`if (!condition) return;`), **Missing Assertions**, **Hardcoded Delays** (`pause(30000)`), aur **Shared State Contamination** jaise issues hain.
5. **No Mobile Tests:** Android aur iOS ke liye koi automated runtime/functional test nahi hai (Detox/Appium absent).

---

## 2. Testing Structure & Folder Layout

Testing code pure project me centralized tarike se `tests/` folder ke andar structured hai:

```
jitsi-meet/
├── package.json               <-- [ISSUE] No "test" script defined here!
├── react/                     <-- Core Web & Mobile Frontend (87 features)
│   ├── features/              <-- ZERO unit tests (*.test.ts / *.spec.ts = 0)
│   └── index.web.js / native
├── tests/                     <-- Isolated Sub-project for Tests
│   ├── package.json           <-- Dedicated runner dependencies (WDIO 9, Mocha)
│   ├── wdio.conf.ts           <-- Master WebdriverIO configuration (Multi-browser)
│   ├── env.example            <-- Environment variables (BASE_URL, JAAS_KID, etc.)
│   ├── helpers/               <-- Participant wrappers, tokens, matchers, grid
│   ├── pageobjects/           <-- 23 Page Object Model (POM) classes
│   ├── specs/                 <-- 65 WebdriverIO E2E spec files
│   │   ├── helpers/           <-- Spec-level utilities (DialIn, mute)
│   │   ├── iframe/            <-- 5 specs (IFrame / External API)
│   │   ├── jaas/              <-- 18 specs (JaaS / 8x8 Cloud specific)
│   │   ├── media/             <-- 11 specs (Mute, Video, Screenshare, Codecs)
│   │   ├── misc/              <-- 16 specs (Polls, Avatars, Breakout rooms, etc.)
│   │   ├── moderation/        <-- 5 specs (Lobby, Kick, Grant Moderator, Lock)
│   │   └── ui/                <-- 10 specs (Chat, Filmstrip, TileView, PreJoin)
│   ├── malleus/               <-- Load testing tool (Malleus Jitsificus)
│   └── prosody/               <-- Backend XMPP Prosody plugin tests
│       ├── package.json       <-- Busted (Lua) + Mocha (Testcontainers)
│       ├── lua/               <-- 13 Busted Lua specs
│       └── *_spec.js          <-- 46 Mocha integration specs
└── .github/workflows/         <-- CI Workflows (ci.yml, prosody-plugin-tests.yml)
```

---

## 3. Existing Tests: Frameworks & Execution Format

### 3.1 WebdriverIO + Mocha Multi-Participant Runner (`tests/`)
- **Framework:** WebdriverIO v9.27.0 + `@wdio/mocha-framework`.
- **Architecture:** Multi-Remote Browser Orchestration (`ctx.p1`, `ctx.p2`, ... `ctx.p6`). Har browser ek virtual participant ban kar meeting join karta hai.
- **Media Emulation:** Fake WebRTC streams inject kiye jaate hain:
  - `--use-fake-ui-for-media-stream`
  - `--use-fake-device-for-media-stream`
  - `--use-file-for-fake-audio-capture=fakeAudioStream.wav`
- **Page Object Model (POM):** UI selectors and actions `tests/pageobjects/` me encapsulated hain (e.g. `Toolbar.ts`, `ChatPanel.ts`, `Filmstrip.ts`, `LobbyScreen.ts`).

### 3.2 Prosody Plugin Test Suite (`tests/prosody/`)
- **Unit Tests:** Lua `busted` framework (`tests/prosody/lua/*_spec.lua`).
- **Integration Tests:** `testcontainers` + `@xmpp/client` + `mocha`. Ye Docker container me ek live Prosody XMPP server launch karta hai aur real XMPP stanzas bhej kar server-side authorization/MUC plugins verify karta hai.

---

## 4. Problems Identified in Existing Tests

Codebase ke existing tests me audit ke dauran nimnlikhit **8 gambhir samasyaen (problems)** payi gayi hain:

### Problem 1: Silent Pass Anti-Pattern (`if (...) return;`)
Kayi specs me assertions ya conditions match na hone par test silently exit kar jata hai:
```typescript
// File: tests/specs/media/mute.spec.ts (Line 33)
it('p1 mutes p2 and check', async () => {
    const { p1, p2 } = ctx;

    if (!await p1.isModerator()) {
        return; // <-- DANGER! Mocha treats this as PASSED (Green)!
    }

    await p1.getFilmstrip().muteAudio(p2);
    await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
});
```
> **Risk:** Agar test environment me `p1` moderator nahi hai, toh bina kisi verification ke test pass ho jayega! Isko `this.skip()` ya `ctx.skipSuiteTests` hona chahiye tha.

### Problem 2: Flaky Hardcoded Sleeps (`pause()`)
Explicit condition polling (`waitUntil`) ke bajay hardcoded delays use kiye gaye hain:
- `tests/specs/jaas/recording.spec.ts`: `await p.driver.pause(30000);` (30 seconds sleep!)
- `tests/specs/helpers/DialIn.ts`: `await browser.pause(10000);` (10 seconds sleep)
- `tests/specs/media/activeSpeaker.spec.ts`: 7 alag-alag jagah `pause(1000)` aur `pause(2000)`.
> **Risk:** Slow networks ya busy CI runners par ye time out ho jate hain, aur fast machines par be-matlab test suite ko bohot slow kar dete hain.

### Problem 3: Empty / Missing Assertions in Test Steps
Kayi `it()` blocks me koi `expect()` assertion hi nahi hai:
```typescript
// File: tests/specs/misc/polls.spec.ts (Line 70)
it('send poll', async () => {
    const { p1 } = ctx;

    await p1.getChatPanel().clickSendPollButton();
    // No assertion! Did the poll send? Did UI update? Nobody checks.
});
```

### Problem 4: Test Title vs Code Logic Mismatch (Bug in Test)
Test description aur actual action opposite hain:
```typescript
// File: tests/specs/ui/chatPanel.spec.ts (Line 27)
it('use button to open', async () => {
    const { p1 } = ctx;

    await p1.getToolbar().clickCloseChatButton(); // Actually closing, not opening!
    expect(await p1.getChatPanel().isOpen()).toBe(false);
});
```

### Problem 5: State Pollution Between Sequential Tests
Mocha ke `it()` blocks independent nahi hain:
```typescript
// File: tests/specs/ui/displayName.spec.ts
it('joining the meeting', ...)
it('check change', ...)        // Mutates state
it('check persistence', ...)   // Depends on mutated state from previous test
```
Agar `check change` fail ho jaye, toh `check persistence` automatically break ho jata hai. Clean reset (`afterEach`) missing hai.

### Problem 6: Direct Coupling to Internal `APP.store` Global
Black-box E2E testing ke bajay tests browser window ke global redux store ko poke karte hain:
```typescript
// File: tests/specs/misc/polls.spec.ts (Line 82)
const pollId: string = await p1.driver.waitUntil(() => p1.driver.execute(() => {
    return Object.keys(APP.store.getState()['features/polls'].polls)[0];
}), { timeout: 2000 });
```
Agar internal Redux state shape badal gayi, toh UI theek hone par bhi E2E tests toot jayenge.

### Problem 7: Deprecated Node.js APIs in Test Harness
`tests/wdio.conf.ts` me obsolete API use ho rahi hai:
```typescript
// tests/wdio.conf.ts (Line 24)
require.extensions['.web.ts'] = require.extensions['.ts'];
```
`require.extensions` officially deprecated hai aur modern Node versions me remove ho sakti hai.

### Problem 8: E2E Tests CI me Run hi Nahi Hote
`.github/workflows/ci.yml` check karne par pata chalta hai ki CI me sirf:
- `npm run lint:ci && npm run tsc:ci`
- `make`
- Mobile bundle check
run hota hai. **WebdriverIO E2E test suite PR check me run hi nahi hota**, kyunki live infrastructure setup expensive aur heavy hai.

---

## 5. Missing Test Coverage (Sabse Important Missing Jagah)

### 5.1 Frontend Unit Tests (100% Missing!)
`react/features` ke andar **87 features** aur `react/features/base` ke andar **42 sub-modules** hain. In sabhi me **0 unit tests** hain:

| Category | Missing Areas | Risk Level |
|---|---|---|
| **Redux State** | 100+ Reducers, 100+ Middleware, 200+ Actions | 🔴 CRITICAL |
| **Utilities** | `base/util/uri.ts`, `base/util/helpers.ts`, `strings.ts` | 🔴 CRITICAL |
| **Token Handling** | `base/jwt/functions.ts` (JWT parsing, expiry, validation) | 🔴 CRITICAL |
| **Tracks & Media** | `base/tracks/functions.any.ts` (audio/video mute, track lifecycle) | 🔴 CRITICAL |
| **Conference** | `base/conference/functions.ts` (room connection, P2P/JVB toggle) | 🔴 CRITICAL |

### 5.2 Critical Business Features with Zero E2E & Zero Unit Tests

1. **End-to-End Encryption (E2EE / Olm / SFrame) - `react/features/e2ee/`:**
   - Security-critical feature: Key ratchet, SAS emoji verification, cryptographic key exchanges.
   - **Test Status:** 0% Coverage (No unit tests, no E2E tests).
2. **Device Selection & Switching - `react/features/device-selection/` & `base/devices/`:**
   - User call ke dauran mic/speaker/camera switch karta hai, device unplug hone par fallback handling.
   - **Test Status:** 0% Coverage.
3. **Collaborative Whiteboard (Excalidraw) - `react/features/whiteboard/`:**
   - Multi-user drawing, canvas sync, pointer sharing.
   - **Test Status:** 0% Coverage.
4. **Calendar Sync (Google & Microsoft) - `react/features/calendar-sync/`:**
   - OAuth flow, calendar event fetching, scheduled meetings.
   - **Test Status:** 0% Coverage.
5. **Network Resilience & ICE Restart - `base/conference/networkChangeIceRestart`:**
   - Network drop, Wi-Fi se Cellular switch, offline reconnection.
   - **Test Status:** 0% Coverage.
6. **Screen Share Audio (System Audio) - `react/features/screen-share/`:**
   - Sirf basic video sharing E2E me hai, system audio sharing untested hai.
7. **Call Quality Feedback & Telemetry - `react/features/feedback/`, `react/features/rtcstats/`:**
   - Post-call rating, stats aggregation, analytics dispatch.
   - **Test Status:** 0% Coverage.
8. **Reactions & GIF Animations - `react/features/reactions/`, `react/features/gifs/`:**
   - Floating emojis, sound triggers, Giphy integration.
   - **Test Status:** Minimal/Untested.

### 5.3 Mobile App (Android & iOS) Tests - 100% Missing
- Android (`android/`) aur iOS (`ios/`) me sirf SDK compile hota hai.
- React Native components ke liye koi:
  - Jest Native tests nahi hain.
  - Detox / Appium E2E tests nahi hain.
  - Native UI tests (Espresso / XCTest) nahi hain.

---

## 6. Detailed Feature Coverage Audit (87 Features)

| # | Feature Name | E2E Coverage | Unit Test | Status |
|---|---|---|---|---|
| 1 | `always-on-top` | ❌ None | ❌ None | 🔴 Missing |
| 2 | `analytics` | ❌ None | ❌ None | 🔴 Missing |
| 3 | `app` | ❌ None | ❌ None | 🔴 Missing |
| 4 | `audio-level-indicator` | ❌ None | ❌ None | 🔴 Missing |
| 5 | `audio-translation` | ⚠️ Prosody only | ❌ None | 🟡 Missing Frontend |
| 6 | `authentication` | ⚠️ JaaS E2E only | ❌ None | 🟡 Missing XMPP/OAuth |
| 7 | `av-moderation` | ✅ `audioVideoModeration.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 8 | `base/*` (42 modules) | ⚠️ Indirect via E2E | ❌ None | 🔴 CRITICAL MISSING |
| 9 | `breakout-rooms` | ✅ `breakoutRooms.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 10 | `calendar-sync` | ❌ None | ❌ None | 🔴 Missing |
| 11 | `chat` | ✅ `chatPanel.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 12 | `chrome-extension-banner` | ❌ None | ❌ None | 🔴 Missing |
| 13 | `client-requirements` | ❌ None | ❌ None | 🔴 Missing |
| 14 | `conference` | ⚠️ Indirect via E2E | ❌ None | 🔴 CRITICAL MISSING |
| 15 | `connection-indicator` | ❌ None | ❌ None | 🔴 Missing |
| 16 | `connection-stats` | ❌ None | ❌ None | 🔴 Missing |
| 17 | `custom-panel` | ❌ None | ❌ None | 🔴 Missing |
| 18 | `deep-linking` | ⚠️ JaaS mobile only | ❌ None | 🟡 Partial |
| 19 | `desktop-picker` | ❌ None | ❌ None | 🔴 Missing |
| 20 | `device-selection` | ❌ None | ❌ None | 🔴 CRITICAL MISSING |
| 21 | `display-name` | ✅ `displayName.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 22 | `dropbox` | ❌ None | ❌ None | 🔴 Missing |
| 23 | `dynamic-branding` | ❌ None | ❌ None | 🔴 Missing |
| 24 | `e2ee` | ❌ None | ❌ None | 🔴 CRITICAL MISSING |
| 25 | `embed-meeting` | ❌ None | ❌ None | 🔴 Missing |
| 26 | `etherpad` | ❌ None | ❌ None | 🔴 Missing |
| 27 | `external-api` | ✅ `iframe/*.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 28 | `face-landmarks` | ❌ None | ❌ None | 🔴 Missing |
| 29 | `feedback` | ❌ None | ❌ None | 🔴 Missing |
| 30 | `file-sharing` | ✅ `jaas/fileSharing.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 31 | `filmstrip` | ✅ `Filmstrip.ts` POM | ❌ None | 🟡 Needs Unit Tests |
| 32 | `follow-me` | ✅ `followMe.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 33 | `gifs` | ❌ None | ❌ None | 🔴 Missing |
| 34 | `google-api` | ❌ None | ❌ None | 🔴 Missing |
| 35 | `invite` | ⚠️ POM only | ❌ None | 🟡 Missing Spec |
| 36 | `jaas` | ✅ 18 Dedicated Specs | ❌ None | 🟡 Needs Unit Tests |
| 37 | `keyboard-shortcuts` | ⚠️ Partial shortcuts | ❌ None | 🟡 Partial |
| 38 | `large-video` | ✅ `pinning.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 39 | `load-test` | ✅ `malleus` | ❌ None | 🟢 Covered |
| 40 | `lobby` | ✅ `lobby.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 41 | `mobile` | ❌ None | ❌ None | 🔴 CRITICAL MISSING |
| 42 | `multi-screen` | ❌ None | ❌ None | 🔴 Missing |
| 43 | `no-audio-signal` | ❌ None | ❌ None | 🔴 Missing |
| 44 | `noise-detection` | ❌ None | ❌ None | 🔴 Missing |
| 45 | `noise-suppression` | ❌ None | ❌ None | 🔴 Missing |
| 46 | `notifications` | ⚠️ POM only | ❌ None | 🟡 Partial |
| 47 | `old-client-notification` | ❌ None | ❌ None | 🔴 Missing |
| 48 | `overlay` | ❌ None | ❌ None | 🔴 Missing |
| 49 | `participants-pane` | ✅ POM & E2E | ❌ None | 🟡 Needs Unit Tests |
| 50 | `pip` | ❌ None | ❌ None | 🔴 Missing |
| 51 | `polls` | ✅ `polls.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 52 | `polls-history` | ❌ None | ❌ None | 🔴 Missing |
| 53 | `power-monitor` | ❌ None | ❌ None | 🔴 Missing |
| 54 | `prejoin` | ✅ `preJoin.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 55 | `preload` | ❌ None | ❌ None | 🔴 Missing |
| 56 | `presence-status` | ✅ `participantsPresence.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 57 | `reactions` | ✅ `reactionShortcuts.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 58 | `recent-list` | ❌ None | ❌ None | 🔴 Missing |
| 59 | `recording` | ✅ Multiple specs | ❌ None | 🟡 Needs Unit Tests |
| 60 | `rejoin` | ❌ None | ❌ None | 🔴 Missing |
| 61 | `remote-control` | ❌ None | ❌ None | 🔴 Missing |
| 62 | `room-lock` | ✅ `lockRoom.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 63 | `rtcstats` | ❌ None | ❌ None | 🔴 Missing |
| 64 | `salesforce` | ❌ None | ❌ None | 🔴 Missing |
| 65 | `screen-share` | ✅ `desktopSharing.spec.ts` | ❌ None | 🟡 Audio Share Missing |
| 66 | `screenshot-capture` | ❌ None | ❌ None | 🔴 Missing |
| 67 | `security` | ⚠️ Dialog POM only | ❌ None | 🟡 Missing Spec |
| 68 | `settings` | ⚠️ Dialog POM only | ❌ None | 🟡 Missing Spec |
| 69 | `share-room` | ❌ None | ❌ None | 🔴 Missing |
| 70 | `shared-video` | ❌ None | ❌ None | 🔴 Missing |
| 71 | `speaker-stats` | ⚠️ Prosody only | ❌ None | 🟡 Missing Frontend |
| 72 | `stream-effects` | ⚠️ Virtual background only | ❌ None | 🟡 Partial |
| 73 | `subtitles` | ⚠️ JaaS transcription only | ❌ None | 🟡 Partial |
| 74 | `talk-while-muted` | ❌ None | ❌ None | 🔴 Missing |
| 75 | `time-timer` | ✅ `timeTimer.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 76 | `toolbox` | ✅ Multiple specs | ❌ None | 🟡 Needs Unit Tests |
| 77 | `transcribing` | ⚠️ JaaS only | ❌ None | 🟡 Partial |
| 78 | `unsupported-browser` | ❌ None | ❌ None | 🔴 Missing |
| 79 | `video-layout` | ✅ `videoLayout.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 80 | `video-menu` | ⚠️ Partial in filmstrip | ❌ None | 🟡 Partial |
| 81 | `video-quality` | ⚠️ Dialog POM only | ❌ None | 🟡 Missing Spec |
| 82 | `videosipgw` | ❌ None | ❌ None | 🔴 Missing |
| 83 | `virtual-background` | ✅ `virtualBackground.spec.ts` | ❌ None | 🟡 Needs Unit Tests |
| 84 | `visitors` | ✅ 4 JaaS visitor specs | ❌ None | 🟡 Needs Unit Tests |
| 85 | `web-hid` | ❌ None | ❌ None | 🔴 Missing |
| 86 | `welcome` | ❌ None | ❌ None | 🔴 Missing |
| 87 | `whiteboard` | ❌ None | ❌ None | 🔴 CRITICAL MISSING |

---

## 7. Recommended Action Plan & Solutions

### Phase 1: Immediate Fixes in Existing E2E Tests (1-2 Weeks)
1. **Fix Silent Passes:**
   - Sabhi `if (!await p.isModerator()) return;` ko `ctx.skipSuiteTests = '...'` ya `this.skip()` se replace karo taaki false positive green tests na aain.
2. **Replace Hardcoded `pause()`:**
   - `pause(30000)` aur `pause(10000)` ko `browser.waitUntil(() => condition, { timeout: ... })` se replace karo.
3. **Fix Test Names & Logic Inconsistencies:**
   - E.g. `tests/specs/ui/chatPanel.spec.ts` me close button click wale test ko `it('use button to close')` karo.
4. **Add Root `npm test` Script:**
   - Root `package.json` me standard test scripts add karo:
     ```json
     "scripts": {
       "test:e2e": "cd tests && npm run test",
       "test:prosody": "cd tests/prosody && npm run test"
     }
     ```

### Phase 2: Introduce Frontend Unit Testing Framework (2-4 Weeks)
1. **Setup Vitest or Jest in Root:**
   - Lightweight, TypeScript + JSX support with `jsdom`.
2. **First Target (P0 Redux & Utils):**
   - Reducers & Actions for:
     - `react/features/base/jwt`
     - `react/features/base/util/uri.ts`
     - `react/features/base/conference`
     - `react/features/chat`
     - `react/features/e2ee`
3. **Mocking `lib-jitsi-meet`:**
   - Ek reusable mock layer banao for `JitsiConference`, `JitsiConnection`, and `JitsiTrack`.

### Phase 3: CI/CD Pipeline & Coverage Enforcement (Month 2)
1. GitHub Actions me Unit test step add karo: `npm run test:unit -- --coverage`.
2. Code coverage threshold minimum 60% set karo for utility functions and reducers.
3. E2E tests ke liye daily nightly scheduled run setup karo instead of skipping them completely.
