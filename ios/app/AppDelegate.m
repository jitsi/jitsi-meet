/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"
#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>
#import "RCTBundleURLProvider.h"
#import "RCTLinkingManager.h"
#import "RCTRootView.h"

@implementation AppDelegate

// https://facebook.github.io/react-native/docs/linking.html
- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [Fabric with:@[[Crashlytics class]]];

  NSURL *jsCodeLocation
    = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios"
                                                     fallbackResource:nil];
  RCTRootView *rootView
    = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                  moduleName:@"App"
                           initialProperties:nil
                               launchOptions:launchOptions];

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

// https://facebook.github.io/react-native/docs/linking.html
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
        annotation:(id)annotation
{
  return [RCTLinkingManager application:application
                                openURL:url
                      sourceApplication:sourceApplication
                             annotation:annotation];
}

@end
