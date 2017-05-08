# Jitsi Meet SDK for iOS

This directory contains the source code for Jitsi Meet for iOS (the application)
and the Jitsi Meet SDK.

## Jitsi Meet SDK

JitsiMeet is an iOS framework which embodies the Jitsi Meet experience,
gift-wrapped so other applications can use it. Using it is very simple. Use
a Storyboard or Interface Builder to add a `JitsiMeetView` to your
application.

Then, once the view has loaded, set the delegate in your controller and load the
desired URL:

```objc
- (void)viewDidLoad {
  [super viewDidLoad];

  JitsiMeetView *meetView = (JitsiMeetView*) self.view;
  meetView.delegate = self;
  [meetView loadURL:nil];
}
```

### JitsiMeetView class

The `JitsiMeetView` class is the entrypoint to the SDK. It a subclass of
`UIView` which renders a full conference in the designated area.

```objc
[meetView loadURL:[NSURL URLWithString:@"https://meet.jit.si/test123"]];
```

Loads the given URL and joins the room. If `null` is specified the welcome page
is displayed instead.

#### Universal / deep linking

In order to support universal / deep linking, `JitsiMeetView` offers 2 class
methods that you application's delegate should call in order for the application
to follow those links. Example:

```objc
- (BOOL)application:(UIApplication *)application
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

TODO.
