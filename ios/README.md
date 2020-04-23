# Jitsi Meet SDK for iOS

The Jitsi Meet iOS SDK provides the same user experience as the Jitsi Meet app,
in a customizable way which you can embed in your apps.

## Sample applications using the SDK

If you want to see how easy integrating the Jitsi Meet SDK into a native application is, take a look at the
[sample applications repository](https://github.com/jitsi/jitsi-meet-sdk-samples).

## Usage

There are 2 ways to integrate the SDK into your project:

- Using CocoaPods
- Building it yourself

### Using CocoaPods

Follow the instructions [here](https://github.com/jitsi/jitsi-meet-ios-sdk-releases/blob/master/README.md).

### Building it yourself

1. Install all required [dependencies](https://github.com/jitsi/jitsi-meet/blob/master/doc/mobile.md).

2. `xcodebuild -workspace ios/jitsi-meet.xcworkspace -scheme JitsiMeet -destination='generic/platform=iOS' -configuration Release archive`

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

  JitsiMeetConferenceOptions *options = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
      builder.serverURL = [NSURL URLWithString:@"https://meet.jit.si"];
      builder.room = @"test123";
      builder.audioOnly = YES;
  }];

  [jitsiMeetView join:options];
}
```

### JitsiMeetView class

The `JitsiMeetView` class is the entry point to the SDK. It a subclass of
`UIView` which renders a full conference in the designated area.

#### delegate

Property to get/set the `JitsiMeetViewDelegate` on `JitsiMeetView`.

#### join:JitsiMeetConferenceOptions

Joins the conference specified by the given options.

```objc
  JitsiMeetConferenceOptions *options = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
      builder.serverURL = [NSURL URLWithString:@"https://meet.jit.si"];
      builder.room = @"test123";
      builder.audioOnly = NO;
      builder.audioMuted = NO;
      builder.videoMuted = NO;
      builder.welcomePageEnabled = NO;
  }];

  [jitsiMeetView join:options];
```

#### leave

Leaves the currently active conference.

#### Universal / deep linking

In order to support Universal / deep linking, `JitsiMeet` offers 2 class
methods that you app's delegate should call in order for the app to follow those
links.

If these functions return NO it means the URL wasn't handled by the SDK. This
is useful when the host application uses other SDKs which also use linking.

```objc
-  (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{
  return [[JitsiMeet sharedInstance] application:application
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
  return [[JitsiMeet sharedInstance] application:app
                            openURL:url
                            options: options];
}
```

### JitsiMeetViewDelegate

This delegate is optional, and can be set on the `JitsiMeetView` instance using
the `delegate` property.

It provides information about the conference state: was it joined, left, did it
fail?

All methods in this delegate are optional.

#### conferenceJoined

Called when a conference was joined.

The `data` dictionary contains a "url" key with the conference URL.

#### conferenceTerminated

Called when a conference was terminated either by user choice or due to a
failure.

The `data` dictionary contains an "error" key with the error and a "url" key
with the conference URL. If the conference finished gracefully no `error`
key will be present.

#### conferenceWillJoin

Called before a conference is joined.

The `data` dictionary contains a "url" key with the conference URL.

#### enterPictureInPicture

Called when entering Picture-in-Picture is requested by the user. The app should
now activate its Picture-in-Picture implementation (and resize the associated
`JitsiMeetView`. The latter will automatically detect its new size and adjust
its user interface to a variant appropriate for the small size ordinarily
associated with Picture-in-Picture.)

The `data` dictionary is empty.

### Picture-in-Picture

`JitsiMeetView` will automatically adjust its UI when presented in a
Picture-in-Picture style scenario, in a rectangle too small to accommodate its
"full" UI.

Jitsi Meet SDK does not currently implement native Picture-in-Picture on iOS. If
desired, apps need to implement non-native Picture-in-Picture themselves and
resize `JitsiMeetView`.

If `delegate` implements `enterPictureInPicture:`, the in-call toolbar will
render a button to afford the user to request entering Picture-in-Picture.

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

2. Make sure your app calls the Jitsi Meet SDK universal / deep linking delegate
   methods.
