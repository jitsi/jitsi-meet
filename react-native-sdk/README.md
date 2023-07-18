# <p align="center">Jitsi Meet React Native SDK</p>


## Installation
Inside your project, run `npm i @jitsi/react-native-sdk`.<br/><br/>Additionally, if not already installed, some dependencies will need to be added.

This can be done by running the following script:
```
node node_modules/@jitsi/react-native-sdk/update_dependencies.js
```
This will check and update all your dependencies.<br/><br/>


 [comment]: # (These deps definitely need to be added manually, more could be neccesary)

Because of SVG use in react native, you need to update metro.config your project's file:

```
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

### iOS

#### Project Info.plist
- Add a *Privacy - Camera Usage Description*
- Add a *Privacy - Microphone Usage Description*

#### General
- Signing & capabilites:
    - Add Background modes
        - Audio
        - Voice over IP
        - Background fetch
- Add Copy Sounds step:
1. Open XCode, go to Build Phases and add this step and the script below.

```
    SOUNDS_DIR="${PROJECT_DIR}/../node_modules/@jitsi/react-native-sdk/sounds"
    cp $SOUNDS_DIR/* ${CONFIGURATION_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/
```

Run `cd ios && pod install && cd ..`

### Android

- In your build.gradle have at least `minSdkVersion = 24`
- In `android/app/src/debug/AndroidManifest.xml` and `android/app/src/main/AndroidManifest.xml`, under the `</application>` tag, include
  ```
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
  ```

