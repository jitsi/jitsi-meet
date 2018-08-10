# Setting up Google Authentication

- Create a Firebase project here: https://firebase.google.com/. You'll need a
signed Android build for that, that can be a debug auto-signed build too, just
retrieve the signing hash.
- Place the generated ```google-services.json``` file in ```android/app```
for Android and the ```GoogleService-Info.plist``` into ```ios/app/src``` for
iOS (you can stop at that step, no need for the driver and the code changes they
suggest in the wizard).
- You may want to exclude these files in YOUR GIT config (do not exclude them in
the ```.gitignore``` of the application itself!).
- Your WEB and iOS client IDs are auto generated during the Firebase project
 creation. Find them in the Google Developer console:
 https://console.developers.google.com/
- Make sure your config reflects these IDs so then the Redux state of the
 feature ```features/base/config``` contains variables
 ```googleApiApplicationClientID``` and ```googleApiIOSClientID``` with the
 respective values.
- Add your iOS client ID as an application URL schema into
```ios/app/src/Info.plist``` (replacing placeholder).
- Enable YouTube API access on the developer console (see above) for live
streaming.
