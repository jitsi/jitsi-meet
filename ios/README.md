# Jitsi Meet SDK for iOS

This directory contains the source code of the Jitsi Meet app and the Jitsi Meet
SDK for iOS.

## Jitsi Meet SDK

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

  JitsiMeetView *view = (JitsiMeetView *) self.view;

  view.delegate = self;
  [view loadURL:nil];
}
```

### JitsiMeetView class

The `JitsiMeetView` class is the entry point to the SDK. It a subclass of
`UIView` which renders a full conference in the designated area.

#### delegate

Property for getting / setting the `JitsiMeetViewDelegate` on `JitsiMeetView`.

#### welcomePageEnabled

Property for getting / setting whether the Welcome page is enabled. If NO, a
black empty view will be rendered when not in a conference. Defaults to NO.

NOTE: Must be set before calling `loadURL` for it to take effect.

#### loadURL(URL)

```objc
[meetView loadURL:[NSURL URLWithString:@"https://meet.jit.si/test123"]];
```

Loads the given URL and joins the room. If `null` is specified, the welcome page
is displayed instead.

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
