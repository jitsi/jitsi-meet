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
#import "Types.h"
#import "ViewController.h"
@import JitsiMeetSDK;

@implementation AppDelegate

-             (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    JitsiMeet *jitsiMeet = [JitsiMeet sharedInstance];

    jitsiMeet.conferenceActivityType = JitsiMeetConferenceActivityType;
    jitsiMeet.customUrlScheme = @"janeoa";
    jitsiMeet.universalLinkDomains = @[@"videochat-jwt.jane.qa",@"videochat.jane.qa",@"videochat-chrisw.jane.qa",@"videochat-us.janeapp.com",@"videochat-ca.janeapp.com",@"videochat-ca2.janeapp.com",@"videochat.janeapp.com.au",@"videochat.janeapp.co.uk",@"jitsi2.jane.qa",@"conference-pod-cac1-j1.janeapp.net",@"conference-pod-usw2-j2.janeapp.net",@"conference-pod-euw2-j3.janeapp.net",@"conference-pod-apse2-j4.janeapp.net",@"video-conference-ca.janeapp.net",@"video-conference-us.janeapp.net",@"video-conference-uk.janeapp.net",@"video-conference-au.janeapp.net",@"video-conference.jane.qa"];

    jitsiMeet.defaultConferenceOptions = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
        [builder setFeatureFlag:@"resolution" withValue:@(360)];
        [builder setFeatureFlag:@"ios.screensharing.enabled" withBoolean:YES];
        builder.serverURL = [NSURL URLWithString:@"https://videochat.jane.qa"];
        builder.welcomePageEnabled = YES;

        // Apple rejected our app because they claim requiring a
        // Dropbox account for recording is not acceptable.
#if DEBUG
        [builder setFeatureFlag:@"ios.recording.enabled" withBoolean:YES];
#endif
    }];

  [jitsiMeet application:application didFinishLaunchingWithOptions:launchOptions];

    ViewController *rootController = (ViewController *)self.window.rootViewController;
    [jitsiMeet showSplashScreen:rootController.view];

    return YES;
}

- (void) applicationWillTerminate:(UIApplication *)application {
    NSLog(@"Application will terminate!");
    // Try to leave the current meeting graceefully.
    ViewController *rootController = (ViewController *)self.window.rootViewController;
    [rootController terminate];
}

#pragma mark Linking delegate methods

-    (BOOL)application:(UIApplication *)application
  continueUserActivity:(NSUserActivity *)userActivity
    restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *restorableObjects))restorationHandler {

    // 2. Default to plain old, non-Firebase-assisted Universal Links.
    return [[JitsiMeet sharedInstance] application:application
                              continueUserActivity:userActivity
                                restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {

    // This shows up during a reload in development, skip it.
    // https://github.com/firebase/firebase-ios-sdk/issues/233
    if ([[url absoluteString] containsString:@"google/link/?dismiss=1&is_weak_match=1"]) {
        return NO;
    }

    NSURL *openUrl = url;

    return [[JitsiMeet sharedInstance] application:app
                                           openURL:openUrl
                                           options:options];
}

@end
