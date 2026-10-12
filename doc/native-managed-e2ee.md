# Native managed E2EE: dependent implementation draft

This draft connects the SDK's real conference creation path to a native frame-cryptor backend. It keeps lib-jitsi-meet's Olm key exchange and managed participant-key lifecycle. Applications do not supply media keys. This is not an announcement of native E2EE support in the released SDK.

## Required dependency chain

The runtime requires all of the following:

1. A lib-jitsi-meet release with `registerNativeE2EE`, `setE2EEEnabled`, and the native managed conference implementation. The package must expose its React Native ESM entry through its own package metadata. There is no Metro alias to a staged lib-jitsi-meet checkout.
2. A react-native-webrtc bridge exposing `RTCPeerConnection.isNativeManagedE2EESupported()` and the managed conference, sender, receiver, retirement and HKDF methods checked by this runtime.
3. A matching native WebRTC artifact implementing those methods and the Jitsi-compatible frame cryptor. The tested prototype used M144; this repository currently depends on the M124 React Native WebRTC release. Replacing only JavaScript or changing an SDK version number cannot resolve that binary compatibility requirement.
4. Hermes, the full SDK, the existing `react-native-get-random-values` native module and the unmodified `@matrix-org/olm` legacy distribution.

This draft deliberately does not change dependency versions to unpublished packages. Stock dependencies continue to bundle; native E2EE stays unavailable. Maintainers need to agree on the bridge/native implementation, artifact build, versioning and release order before this can become a supported SDK feature.

## Explicit activation and failure behavior

For a compatible build, the initial experimental scope is JVB with Opus audio and VP8 video:

```js
config.e2ee = { nativeManaged: true, externallyManagedKey: false, disabled: false };
config.p2p = { enabled: false };
config.disableSimulcast = true;
config.flags = { ...config.flags, ssrcRewritingEnabled: false };
config.videoQuality = { mobileCodecPreferenceOrder: [ 'VP8' ] };
```

The lib-jitsi-meet native provider additionally rejects incompatible effective feature flags, including SSRC rewriting and lite mode. The deployment must use settings compatible with that provider. The SDK requires the VP8-only mobile codec list explicitly; lib-jitsi-meet uses this list to filter its advertised codec list, not just to reorder codecs. The native backend remains responsible for rejecting unsupported negotiated codecs, including non-Opus audio. H264, VP9, AV1, simulcast, P2P, screen sharing and seamless encryption toggling are outside this draft's validation scope.

SDK startup registers capability only when the actual bridge, platform runtime and secure entropy source are available. Stock iOS/Android builds, lite builds and non-Hermes runtimes do not load Olm or replace their entropy implementation. Registration failure restores the previous globals. A requested native encrypted conference must fail closed in lib-jitsi-meet when capability is absent; it must never retry as a plaintext conference.

The real SDK `createConference` action waits for `setE2EEEnabled(true)` to acknowledge the local sender key before calling its original `join`. If the user hangs up or another conference replaces it during initialization, the stale join is discarded. An initialization rejection uses the existing conference-failure path. A constructor rejection, where no conference instance exists yet, reports a nonrecoverable connection failure and disconnects.

This integration does not implement a new native E2EE toolbar UI. Disabling the draft native managed context is terminal; re-enabling the same context or transitioning it to plaintext is not supported. The SDK needs a separate UI/lifecycle design before exposing the ordinary browser-style enable/disable interaction.

## Crypto runtime

The SDK invokes the existing native entropy method directly because the package's JavaScript wrapper permits an insecure remote-debug fallback. Native calls and malformed results fail; no replacement PRNG is provided. Olm runs its unchanged legacy distribution without a fake Worker or a WebCrypto implementation. Metro resolves only that distribution's guarded Node imports to an explicit error module; all other resolution remains standard.

The native HKDF adapter uses opaque, single-use tokens, copies caller-owned material and erases mutable bridge arrays after success or failure. Abandoned tokens do not stay strongly referenced by a process-global map. This does not claim that every JavaScript or native temporary copy can be deterministically erased.

## Validation and evidence boundaries

Run the focused source-executing checks with:

```sh
node --test tests/native-e2ee/*.test.cjs
npm run lint:ci
npm run tsc:ci
npx react-native bundle --entry-file index.ios.js --platform ios --dev false --bundle-output /tmp/jitsi-ios.js
npx react-native bundle --entry-file index.android.js --platform android --dev false --bundle-output /tmp/jitsi-android.js
```

The tests execute the actual SDK action, native preparation helper, registration module, packaged Olm implementation and packaged lib-jitsi-meet codec selection. They cover startup compatibility, real Olm encryption/decryption, native key acknowledgement ordering, late-join cancellation, failures without plaintext fallback and temporary-key handling. Native bridge calls in these JavaScript tests are test doubles; the tests do not prove Android JNI or native cryptography.

A separate pinned iOS prototype used the full JitsiMeetSDK in an iOS simulator, a browser and a physical Apple TV. It passed six directed audio/video flows through JVB, automatic join/departure key rotation and cleanup, using synthetic capture. That prototype used mobile-sdk-13.1.1 and an earlier lib-jitsi-meet baseline. This current-master draft preserves newer upstream protocol behavior and must be retested with a matching browser and native artifacts. The earlier run is design evidence, not end-to-end proof of this rebased branch.

Remaining work includes dependency publication, current-master interoperability, physical iPhone capture, Android backend and device validation, reconnect and media-replacement coverage, codec negotiation failures, and native UI/lifecycle design. None is implied by successful Metro bundling or the JavaScript regression suite.
