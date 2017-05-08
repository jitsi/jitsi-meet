# Jitsi Meet for iOS

This directory contains the source code for Jitsi Meet for iOS (the application)
and JitsiKit (the SDK).

## JitsiKit

JitsiKit is an iOS framework which embodies the Jitsi Meet experience,
gift-wrapped so other applications can use it. Example use:

```objc
  self.conference = [[JitsiMeet sharedInstance] conferenceForURL:nil];
  UIView *rootView = self.conference.view;
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
```

### JitsiMeet class

The `JitsiMeet` class is the entrypoint to JitsiKit. It's a singleton and
exposes a method to get the one and only instance:

```objc
[JitsiMeet sharedInstance]
```

Once the instance has been created, a new conference can be created as follows:

```objc
JitsiConference *conf = [[JitsiMeet sharedInstance] conferenceForURL:url];
```

If the passed `url` is `nil` then the view will display the welcome page. If a
valid `NSURL` was specified, the conference is joined directly.

See `JitsiConference` for details on how to display it and other API methods.

#### Universal / deep linking

In order to support universal / deep linking, `JitsiMeet` offers 2 class methods
that you application's delegate should call in order for the application to
follow those links. Example:

```objc
- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{
  return [JitsiMeet application:application
           continueUserActivity:userActivity
             restorationHandler:restorationHandler];
 }

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
        annotation:(id)annotation
{
  return [JitsiMeet application:application
                        openURL:url
              sourceApplication:sourceApplication
                    annotation:annotation];
}
```

### JitsiConference

`JitsiConference` objects represent a view of a given conference (or the welcome
page in the absence of one). It's created using the `conferenceForURL` method in
`JitsiMeet` and offers the following API:

#### Properties

* **view**: a readonly property containing the `UIView` of the conference.

