# iOS background tests

Build the JitsiMeetSDK XCFramework for iOS and iOS Simulator and place it in one directory with matching `hermesvm.xcframework`, `WebRTC.xcframework`, and `GiphyUISDK.xcframework` from that build's Pods dependencies. The JitsiMeetSDK simulator slice must match the simulator architecture. Xcode, an available iOS Simulator, Ruby, and the `xcodeproj` gem from the repository's Gemfile are required.

From `ios/`, run:

```sh
ruby sdk/tests/run-tests.rb --frameworks /path/to/frameworks --destination 'platform=iOS Simulator,id=SIMULATOR_UDID'
```

The runner creates a temporary test host and keeps its build log and result bundle, including on failure. The tests exercise frame processing, failure handling, session ownership, and bundled background choices against the supplied SDK. They do not prove real-camera behavior or a live meeting.
