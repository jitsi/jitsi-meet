#import "AppDelegate.h"


@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.conference = [[JitsiMeet sharedInstance] conferenceForURL:nil];
  UIView *rootView = self.conference.view;
  
  // Set a background color which is in accord with the JavaScript and Android
  // parts of the application and causes less perceived visual flicker than the
  // default background color.
  rootView.backgroundColor
    = [[UIColor alloc] initWithRed:.07f green:.07f blue:.07f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

#pragma mark linking delegate methods

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
 
@end
