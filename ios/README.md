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

NOTE: Must be set before `loadURL:`/`loadURLString:` for it to take effect.

#### welcomePageEnabled

Property to get/set whether the Welcome page is enabled. If `NO`, a black empty
view will be rendered when not in a conference. Defaults to `NO`.

NOTE: Must be set before `loadURL:`/`loadURLString:` for it to take effect.

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

#### loadConfigError

Called when loading the main configuration file from the Jitsi Meet deployment
fails.

The `data` dictionary contains an "error" key with the error and a "url" key
with the conference URL which necessitated the loading of the configuration
file.
