# <p align="center">Jitsi Meet React Native SDK</p>


## Installation
Inside your project, run;
```console
npm i @jitsi/react-native-sdk
```
If there are conflicts, you can use ```--force```
<br/>Additionally, if not already installed, some dependencies will need to be added.

This can be done by running the following script:
```console
node node_modules/@jitsi/react-native-sdk/update_dependencies.js
```
This will check and update all your dependencies.<br/><br/>
After that you need to ```npm i```, if some dependency versions were updated.

 [comment]: # (These deps definitely need to be added manually, more could be neccesary)

Because of SVG use in react native, you need to update metro.config your project's file:

```javascript
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: {
      sourceExts,
      assetExts
    }
  } = await getDefaultConfig();

  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg']
    }
  }
})();
```

## iOS

#### Project Info.plist
- Add a *Privacy - Camera Usage Description*
- Add a *Privacy - Microphone Usage Description*

#### General
- Signing & capabilites:
    - Add Background modes
        - Audio
        - Voice over IP
        - Background fetch

Run;
```console
cd ios && pod install && cd ..
```

#### Screen share

Screen share on iOS needs a Broadcast Upload Extension in your app. The SDK does not include one.
Screen share works on a physical device with iOS 14 or newer. It does not work in the simulator.

The steps below are complete. For background, see the handbook section
[Creating the Broadcast Upload Extension](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-ios-sdk/#creating-the-broadcast-upload-extension)
and the [swift-screensharing sample](https://github.com/jitsi/jitsi-meet-sdk-samples/tree/master/ios/swift-screensharing).

**1. Create the extension target**

1. In Xcode, choose File > New > Target.
2. Select the Broadcast Upload Extension template.
3. Set the language to Swift.
4. Clear the "Include UI Extension" checkbox.
5. Click Finish. Xcode creates a folder that contains `SampleHandler.swift`.
6. In the new target, set the iOS Deployment Target to 14.0 or newer.

**2. Add the extension code**

1. Copy these five files from the sample into the extension folder:
   `SampleHandler.swift`, `SampleUploader.swift`, `SocketConnection.swift`,
   `DarwinNotificationCenter.swift`, `Atomic.swift`. Replace the generated `SampleHandler.swift`.
2. Make sure that all five files belong to the extension target. Check File Inspector > Target
   Membership.

**3. Create the app group**

1. Choose an app group id, for example `group.com.example.myapp`.
2. In the Apple Developer portal, register the app group.
3. Assign the app group to the App ID of the app and to the App ID of the extension.
4. In Xcode, add the App Groups capability to the app target. Select the group.
5. Add the App Groups capability to the extension target. Select the same group.
6. In `SampleHandler.swift`, set `Constants.appGroupIdentifier` to the same app group id.

**4. Configure the app**

1. Add two keys to the app `Info.plist`:
   - `RTCAppGroupIdentifier`: the app group id.
   - `RTCScreenSharingExtension`: the bundle id of the extension, for example
     `com.example.myapp.broadcast`.
2. Make sure that Background Modes has Audio and Voice over IP. See "General" above.
3. Pass the feature flag to `JitsiMeeting`. The toolbar then shows the screen share button.
   ```jsx
   <JitsiMeeting flags = {{ 'ios.screensharing.enabled': true }} ... />
   ```

> **Important**
> - The app group id must be the same in three places: `Constants.appGroupIdentifier` in
>   `SampleHandler.swift`, the App Groups capability of both targets, and `RTCAppGroupIdentifier`.
>   If they are different, the picker opens and the red status bar appears, but no video reaches
>   the meeting. The SDK cannot detect this.
> - Do not change the notification names `iOS_BroadcastStarted` and `iOS_BroadcastStopped` in
>   `DarwinNotificationCenter.swift`. The SDK listens for these exact names.

**5. Test**

1. Run the app on a physical device.
2. Join a meeting.
3. Tap the screen share button. The system picker opens.
4. Tap Start Broadcast. After the countdown, the red status bar appears and the other
   participants see your screen.
5. Tap the red status bar and stop the broadcast. The screen share ends.

##### Know when screen share starts or stops

Use `eventListeners.onScreenShareToggled({ sharing })`. It fires when the user starts or stops
screen share, from the toolbar button or from the red status bar. It does not fire when the user
dismisses the iOS picker or the Android consent dialog without a start. In that case nothing
changes.

```jsx
  <JitsiMeeting
    eventListeners = {{
        onScreenShareToggled: ({ sharing }) => console.log('screen share', sharing)
    }}
    room = { 'ThisIsNotATestRoomName' }
    serverURL = { 'https://meet.jit.si/' } />
```

## Android

- In your build.gradle have at least `minSdkVersion = 26`
- In your build.gradle have `gradlePluginVersion = "8.4.2"` or higher
- In `android/app/src/debug/AndroidManifest.xml` and `android/app/src/main/AndroidManifest.xml`, under the `</application>` tag, include
  ```xml
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
  ```
  ### Services
    #### Screen share

- Go to your `MainApplication.java` file and add:
    1. `import com.oney.WebRTCModule.WebRTCModuleOptions;` that comes from `react-native-webrtc` dependency.

    2. `WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();` instance it.
    3. `options.enableMediaProjectionService = true;` enable foreground service that takes care of screen-sharing feature.

- Go to your `android/app/src/main/AndroidManifest.xml`, under the `</application>` tag and include
    ```xml
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    ```

If you want to test all the steps before applying them to your app, you can check our React Native SDK sample app here:
https://github.com/jitsi/jitsi-meet-sdk-samples/tree/master/react-native


## Using JWT tokens
- If you are planning to use tokens or another domain, you can do that by updating the following props, as shown below.
- For example:
```javascript
  <JitsiMeeting
    room = { 'ThisIsNotATestRoomName' }
    serverURL = { 'https://meet.jit.si/' }
    token={ 'dkhalhfajhflahlfaahalhfahfsl' } />
```

## Using custom overflow menu buttons
- If you are planning to add custom overflow menu buttons, you can do that by updating the ```config``` prop, as shown below.
- For example:
```javascript
  <JitsiMeeting
    config = {{
        customToolbarButtons: [
            {
                icon: "https://w7.pngwing.com/pngs/987/537/png-transparent-download-downloading-save-basic-user-interface-icon-thumbnail.png",
                id: "btn1",
                text: "Button one"
            }, {
                icon: "https://w7.pngwing.com/pngs/987/537/png-transparent-download-downloading-save-basic-user-interface-icon-thumbnail.png",
                id: "btn2",
                text: "Button two"
            }
        ]
    }}
    room = { 'ThisIsNotATestRoomName' }
    serverURL = { 'https://meet.jit.si/' }
    token = { 'dkhalhfajhflahlfaahalhfahfsl' } />
```

For more details on how you can use React Native SDK with React Native app, you can follow this link:
https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-react-native-sdk
