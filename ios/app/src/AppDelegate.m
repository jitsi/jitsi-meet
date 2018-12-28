/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "AppDelegate.h"
#import "FIRUtilities.h"

#import <JitsiMeet/JitsiMeet.h>

@import Crashlytics;
@import Fabric;
@import Firebase;


@implementation AppDelegate

-             (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    // Initialize Crashlytics and Firebase if a valid GoogleService-Info.plist file was provided.
    if ([FIRUtilities appContainsRealServiceInfoPlist]) {
        NSLog(@"Enablign Crashlytics and Firebase");
        [FIRApp configure];
        [Fabric with:@[[Crashlytics class]]];
    }

    return [JitsiMeetView application:application
        didFinishLaunchingWithOptions:launchOptions];
}

#pragma mark Linking delegate methods

-    (BOOL)application:(UIApplication *)application
  continueUserActivity:(NSUserActivity *)userActivity
    restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *restorableObjects))restorationHandler {

    if ([FIRUtilities appContainsRealServiceInfoPlist]) {
        // 1. Attempt to handle Universal Links through Firebase in order to support
        //    its Dynamic Links (which we utilize for the purposes of deferred deep
        //    linking).
        BOOL handled
          = [[FIRDynamicLinks dynamicLinks]
                handleUniversalLink:userActivity.webpageURL
                         completion:^(FIRDynamicLink * _Nullable dynamicLink, NSError * _Nullable error) {
           NSURL *dynamicLinkURL = dynamicLink.url;
           if (dynamicLinkURL) {
             userActivity.webpageURL = dynamicLinkURL;
             [JitsiMeetView application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
           }
        }];

        if (handled) {
          return handled;
        }
    }

    // 2. Default to plain old, non-Firebase-assisted Universal Links.
    return [JitsiMeetView application:application
                 continueUserActivity:userActivity
                   restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {

    NSURL *openUrl = url;

    if ([FIRUtilities appContainsRealServiceInfoPlist]) {
        // Process Firebase Dynamic Links
        FIRDynamicLink *dynamicLink = [[FIRDynamicLinks dynamicLinks] dynamicLinkFromCustomSchemeURL:url];
        if (dynamicLink != nil) {
            NSURL *dynamicLinkURL = dynamicLink.url;
            if (dynamicLinkURL != nil
                    && (dynamicLink.matchType == FIRDLMatchTypeUnique
                        || dynamicLink.matchType == FIRDLMatchTypeDefault)) {
                // Strong match, process it.
                openUrl = dynamicLinkURL;
            }
        }
    }

    return [JitsiMeetView application:app
                              openURL:openUrl
                              options:options];
}

@end
