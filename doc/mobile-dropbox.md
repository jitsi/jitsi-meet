# Setting up Dropbox integration
1. Create a Dropbox app.
2. Add the following to ```ios/app/src/Info.plist``` by replacing `<APP_KEY>`
   with your own Dropbox app key (which can be found in the
   [App Console](https://www.dropbox.com/developers/apps)):
```
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string></string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>db-<APP_KEY></string>
    </array>
  </dict>
</array>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>dbapi-2</string>
  <string>dbapi-8-emm</string>
</array>
```

**NOTE:** Both Android and iOS builds of the apps will parse the Dropbox app key
from ```ios/app/src/Info.plist```.

**NOTE:** See [Dropbox developer guide](https://www.dropbox.com/developers/reference/developer-guide) for more information
