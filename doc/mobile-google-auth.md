# Setting up Google Authentication

- Create a Firebase project here: https://firebase.google.com/. You'll need a
signed Android build for that, that can be a debug self-signed build too, just
retrieve the signing hash. The key hash of an already signed ap can be obtained
as follows (on macOS): ```keytool -list -printcert -jarfile the-app.apk```
- Place the generated ```google-services.json``` file in ```android/app```
for Android and the ```GoogleService-Info.plist``` into ```ios/app/src``` for
iOS (you can stop at that step, no need for the driver and the code changes they
suggest in the wizard).
- You may want to exclude these files in YOUR GIT config (do not exclude them in
the ```.gitignore``` of the application itself!).
- Your web client ID is auto generated during the Firebase project
 creation. Find them in the Google Developer console
 (https://console.developers.google.com/)
- Make sure your config reflects this ID by setting
```googleApiApplicationClientID``` in config.js.
- Add your iOS client ID (the REVERSED_CLIENT_ID in the plist file) as an
application URL schema into ```ios/app/src/Info.plist```
(replacing placeholder).
- Enable YouTube API access on the developer console (see above) to enable live
streaming.
