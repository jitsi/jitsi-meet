# <p align="center">Jitsi Meet React Native SDK</p>


## Installation
 Inside your project, run `npm i @jitsi/react-native-sdk`.<br/><br/>Additionally if not already installed, the following dependencies need to be added:
 <br/>`npm i @react-native-async-storage/async-storage react-native-webrtc`

 [comment]: # (These deps definitely need to be added manually, more could be neccesary)

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

```
    SOUNDS_DIR="${PROJECT_DIR}/../node_modules/rnsdk/sounds"
    cp $SOUNDS_DIR/* ${CONFIGURATION_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/
```
#### Podfile
- At the beginning of your target step add `pod 'ObjectiveDropboxOfficial', :modular_headers => true`

Run `cd ios && pod install && cd ..`

### Android

- In your build.gradle have at least `minSdkVersion = 24`
- TODO: HOW TO ADD COPY SOUNDS STEP
- Under the `</application>`  tag of your AndroidManifest.xml make sure that it includes
  ```
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
  ```

### TODOS
- Ref ConnectionService to not rely on ReactInstanceHolder anymore
- Add Copy Sounds step to build.gradle
- Include copy sounds step in podspec (if possible)
- Add ranges for dependencies
- Add Build_Config for react native to AppInfoModule
