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
#import "RCTAssert.h"
#import "RCTBundleURLProvider.h"
#import "RCTLinkingManager.h"
#import "RCTRootView.h"

/**
 * A <tt>RCTFatalHandler</tt> implementation which swallows JavaScript errors.
 * In the Release configuration, React Native will (intentionally) raise an
 * unhandled NSException for an unhandled JavaScript error. This will
 * effectively kill the application. <tt>_RCTFatal</tt> is suitable to be in
 * accord with the Web i.e. not kill the application.
 */
RCTFatalHandler _RCTFatal = ^(NSError *error) {
  id jsStackTrace = error.userInfo[RCTJSStackTraceKey];
  @try {
    NSString *name
      = [NSString stringWithFormat:@"%@: %@",
                  RCTFatalExceptionName,
                  error.localizedDescription];
    NSString *message
      = RCTFormatError(error.localizedDescription, jsStackTrace, 75);
    [NSException raise:name format:@"%@", message];
  } @catch (NSException *e) {
    if (!jsStackTrace) {
      @throw;
    }
  }
};

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
#if !DEBUG
  [Fabric with:@[[Crashlytics class]]];

  // In the Release configuration, React Native will (intentionally) raise an
  // unhandled NSException for an unhandled JavaScript error. This will
  // effectively kill the application. In accord with the Web, do not kill the
  // application.
  if (!RCTGetFatalHandler()) {
    RCTSetFatalHandler(_RCTFatal);
  }
#endif

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
