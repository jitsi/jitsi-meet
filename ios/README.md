# Jitsi Meet SDK for iOS

## Build

1. Install all required [dependencies](https://github.com/jitsi/jitsi-meet/blob/master/doc/mobile.md).

2. `xcodebuild -workspace ios/jitsi-meet.xcworkspace -scheme JitsiMeet -destination='generic/platform=iOS' -configuration Release archive`

## Install

After successfully building Jitsi Meet SDK for iOS, copy
`ios/sdk/JitsiMeet.framework` (if the path points to a symbolic link, follow the
symbolic link) and
`node_modules/react-native-webrtc/ios/WebRTC.framework` into your project.

## API

JitsiMeet is an iOS framework which embodies the whole Jitsi Meet experience and
makes it reusable by third-party apps.

To get started:

1. Add a `JitsiMeetView` to your app using a Storyboard or Interface Builder,
   for example.

2. Then, once the view has loaded, set the delegate in your controller and load
   the desired URL:

```objc
- (void)viewDidLoad {
  [super viewDidLoad];

  JitsiMeetView *jitsiMeetView = (JitsiMeetView *) self.view;

  jitsiMeetView.delegate = self;
  [jitsiMeetView loadURL:nil];
}
```

### JitsiMeetView class

The `JitsiMeetView` class is the entry point to the SDK. It a subclass of
`UIView` which renders a full conference in the designated area.

#### delegate

Property to get/set the `JitsiMeetViewDelegate` on `JitsiMeetView`.

#### defaultURL

Property to get/set the default base URL used to join a conference when a
partial URL (e.g. a room name only) is specified to
`loadURLString:`/`loadURLObject:`. If not set or if set to `nil`, the default
built in JavaScript is used: https://meet.jit.si.

NOTE: Must be set (if at all) before `loadURL:`/`loadURLString:` for it to take
effect.

#### pictureInPictureEnabled

Property to get / set whether Picture-in-Picture is enabled. Defaults to `YES`
if `delegate` implements `enterPictureInPicture:`; otherwise, `NO`.

NOTE: Must be set (if at all) before `loadURL:`/`loadURLString:` for it to take
effect.

#### welcomePageEnabled

Property to get/set whether the Welcome page is enabled. If `NO`, a black empty
view will be rendered when not in a conference. Defaults to `NO`.

NOTE: Must be set (if at all) before `loadURL:`/`loadURLString:` for it to take
effect.

#### loadURL:NSURL

```objc
[jitsiMeetView loadURL:[NSURL URLWithString:@"https://meet.jit.si/test123"]];
```

Loads a specific URL which may identify a conference to join. If the specified
URL is `nil` and the Welcome page is enabled, the Welcome page is displayed
instead.

#### loadURLObject:NSDictionary

```objc
[jitsiMeetView loadURLObject:@{
    @"config": @{
        @"startWithAudioMuted": @YES,
        @"startWithVideoMuted": @NO
    },
    @"url": @"https://meet.jit.si/test123"
}];
```

Loads a specific URL which may identify a conference to join. The URL is
specified in the form of an `NSDictionary` of properties which (1) internally
are sufficient to construct a URL (string) while (2) abstracting the specifics
of constructing the URL away from API clients/consumers. If the specified URL is
`nil` and the Welcome page is enabled, the Welcome page is displayed instead.

#### loadURLString:NSString

```objc
[jitsiMeetView loadURLString:@"https://meet.jit.si/test123"];
```

Loads a specific URL which may identify a conference to join. If the specified
URL is `nil` and the Welcome page is enabled, the Welcome page is displayed
instead.

#### Universal / deep linking

In order to support Universal / deep linking, `JitsiMeetView` offers 2 class
methods that you app's delegate should call in order for the app to follow those
links.

```objc
-  (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{
  return [JitsiMeetView application:application
               continueUserActivity:userActivity
                 restorationHandler:restorationHandler];
}
```

And also one of the following:

```objc
// See https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623073-application?language=objc
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [JitsiMeetView application:app
                            openURL:url
                            options: options];
}
```
or
```objc
// See https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623112-application?language=objc
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  return [JitsiMeetView application:application
                            openURL:url
                  sourceApplication:sourceApplication
                         annotation:annotation];
}
```

### JitsiMeetViewDelegate

This delegate is optional, and can be set on the `JitsiMeetView` instance using
the `delegate` property.

It provides information about the conference state: was it joined, left, did it
fail?

All methods in this delegate are optional.

##### conferenceFailed

Called when a joining a conference was unsuccessful or when there was an error
while in a conference.

The `data` dictionary contains an "error" key describing the error and a "url"
key with the conference URL.

#### conferenceJoined

Called when a conference was joined.

The `data` dictionary contains a "url" key with the conference URL.

#### conferenceLeft

Called when a conference was left.

The `data` dictionary contains a "url" key with the conference URL.

#### conferenceWillJoin

Called before a conference is joined.

The `data` dictionary contains a "url" key with the conference URL.

#### conferenceWillLeave

Called before a conference is left.

The `data` dictionary contains a "url" key with the conference URL.

#### enterPictureInPicture

Called when entering Picture-in-Picture is requested by the user. The app should
now activate its Picture-in-Picture implementation (and resize the associated
`JitsiMeetView`. The latter will automatically detect its new size and adjust
its user interface to a variant appropriate for the small size ordinarily
associated with Picture-in-Picture.)

The `data` dictionary is empty.

#### loadConfigError

Called when loading the main configuration file from the Jitsi Meet deployment
fails.

The `data` dictionary contains an "error" key with the error and a "url" key
with the conference URL which necessitated the loading of the configuration
file.

### Picture-in-Picture

`JitsiMeetView` will automatically adjust its UI when presented in a
Picture-in-Picture style scenario, in a rectangle too small to accommodate its
"full" UI.

Jitsi Meet SDK does not currently implement native Picture-in-Picture on iOS. If
desired, apps need to implement non-native Picture-in-Picture themselves and
resize `JitsiMeetView`.

If `pictureInPictureEnabled` is set to `YES` or `delegate` implements
`enterPictureInPicture:`, the in-call toolbar will render a button to afford the
user to request entering Picture-in-Picture.

## Dropbox integration

To setup the Dropbox integration, follow these steps:

1. Add the following to the app's Info.plist and change `<APP_KEY>` to your
Dropbox app key:
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

2. Add the following to the app's `AppDelegate`:
```objc
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [JitsiMeetView application:app
                            openURL:url
                            options:options];
}
```
