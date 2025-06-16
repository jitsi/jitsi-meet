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

## Android

- In your build.gradle have at least `minSdkVersion = 26`
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
