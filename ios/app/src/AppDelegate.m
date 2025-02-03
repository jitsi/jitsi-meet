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
#import "Types.h"
#import "ViewController.h"

@import Firebase;
@import JitsiMeetSDK;

@implementation AppDelegate

-             (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    JitsiMeet *jitsiMeet = [JitsiMeet sharedInstance];

    jitsiMeet.conferenceActivityType = JitsiMeetConferenceActivityType;
    jitsiMeet.customUrlScheme = @"org.jitsi.meet";
    jitsiMeet.universalLinkDomains = @[@"meet.jit.si", @"alpha.jitsi.net", @"beta.meet.jit.si"];

    jitsiMeet.defaultConferenceOptions = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {

        // For testing configOverrides a room needs to be set
        builder.room = @"test0988test";

        [builder setFeatureFlag:@"welcomepage.enabled" withBoolean:YES];
        [builder setFeatureFlag:@"ios.screensharing.enabled" withBoolean:YES];
        [builder setFeatureFlag:@"ios.recording.enabled" withBoolean:YES];
//        [builder setConfigOverride:@"customToolbarButtons" withArray:@[
//          @{
//              @"icon": @"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFISURBVHgBxVWBcYMwDJQ7QbuBu4FHcDfoBvEGZQOSicgGdIPQCWADRnClQ76qYFE7Vy5/J3yRXpKlCAFwMEwJKcbo8CCxrJpQBmPMAPcCgz6jtChz1DGifBC3NrhnZ0KPElCsrIh1nUjkS4OfapwosbjM6S+yZ+Ktpmxu5419/R5pZKnraYk/Khu+gYU7ITpwTjojjCMeXzh675ozLKNKuCJvUng98dD+IpWOMwfFqY1btAo3sN3tK39sNurwO/xAv59Yb+mhvJnZljE2FxKtszLBYUgJJnooE7S3b65rhWjzJBOkIH7tgCV/4nGBLS7KJDkZU47pDMuGfMs4perS/zFw4hyvg2VMX9eGszYZpRAT1OSMx64KJh237AQ5vXRjLNhL8fe3I0AJVk4dJ3XCblnXi8t4qAGX3YhEOcw8HGo7H/fR/y98AzFrGjU3gjYAAAAAAElFTkSuQmCC",
//              @"id": @"record",
//              @"text": @"Record"
//          },
//          @{
//              @"icon": @"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik05LjM1MTc1IDAuMDA1MjQ5MDJDOC4zMjY1MSAwLjAwNTI0OTAyIDcuNDMyODMgMC43MDMwMSA3LjE4NDE3IDEuNjk3NjRMNi42OTMyMSAzLjY2MTQ5QzYuMzE5OTkgNS4xNTQzNiA1LjE1NDM2IDYuMzE5OTkgMy42NjE0OSA2LjY5MzIxTDEuNjk3NjQgNy4xODQxN0MwLjcwMzAxMyA3LjQzMjgzIDAuMDA1MjQ5MDIgOC4zMjY1IDAuMDA1MjQ5MDIgOS4zNTE3NUMwLjAwNTI0OTAyIDEwLjM3NyAwLjcwMzAxMiAxMS4yNzA3IDEuNjk3NjQgMTEuNTE5M0wzLjY2MTQ5IDEyLjAxMDNDNS4xNTQzNiAxMi4zODM1IDYuMzE5OTkgMTMuNTQ5MSA2LjY5MzIxIDE1LjA0Mkw3LjE4NDE3IDE3LjAwNTlDNy40MzI4MyAxOC4wMDA1IDguMzI2NTEgMTguNjk4MiA5LjM1MTc1IDE4LjY5ODJDMTAuMzc3IDE4LjY5ODIgMTEuMjcwNyAxOC4wMDA1IDExLjUxOTMgMTcuMDA1OUwxMi4wMTAzIDE1LjA0MkMxMi4zODM1IDEzLjU0OTEgMTMuNTQ5MSAxMi4zODM1IDE1LjA0MiAxMi4wMTAzTDE3LjAwNTggMTEuNTE5M0MxOC4wMDA1IDExLjI3MDcgMTguNjk4MiAxMC4zNzcgMTguNjk4MiA5LjM1MTc1QzE4LjY5ODIgOC4zMjY1IDE4LjAwMDUgNy40MzI4MyAxNy4wMDU4IDcuMTg0MTdMMTUuMDQyIDYuNjkzMjFDMTMuNTQ5MSA2LjMxOTk5IDEyLjM4MzUgNS4xNTQzNiAxMi4wMTAzIDMuNjYxNDlMMTEuNTE5MyAxLjY5NzY0QzExLjI3MDcgMC43MDMwMDkgMTAuMzc3IDAuMDA1MjQ5MDIgOS4zNTE3NSAwLjAwNTI0OTAyWk04Ljc1OTM4IDIuMDkxNDRDOC44MjczMyAxLjgxOTYyIDkuMDcxNTYgMS42Mjg5MyA5LjM1MTc1IDEuNjI4OTNDOS42MzE5MyAxLjYyODkzIDkuODc2MTYgMS44MTk2MiA5Ljk0NDEyIDIuMDkxNDRMMTAuNDM1MSA0LjA1NTI5QzEwLjk1MzcgNi4xMjk5IDEyLjU3MzYgNy43NDk3NiAxNC42NDgyIDguMjY4NDFMMTYuNjEyIDguNzU5MzhDMTYuODgzOSA4LjgyNzMzIDE3LjA3NDYgOS4wNzE1NiAxNy4wNzQ2IDkuMzUxNzVDMTcuMDc0NiA5LjYzMTkzIDE2Ljg4MzkgOS44NzYxNiAxNi42MTIgOS45NDQxMkwxNC42NDgyIDEwLjQzNTFDMTIuNTczNiAxMC45NTM3IDEwLjk1MzcgMTIuNTczNiAxMC40MzUxIDE0LjY0ODJMOS45NDQxMiAxNi42MTIxQzkuODc2MTYgMTYuODgzOSA5LjYzMTkzIDE3LjA3NDYgOS4zNTE3NSAxNy4wNzQ2QzkuMDcxNTYgMTcuMDc0NiA4LjgyNzMzIDE2Ljg4MzkgOC43NTkzOCAxNi42MTIxTDguMjY4NDIgMTQuNjQ4MkM3Ljc0OTc2IDEyLjU3MzYgNi4xMjk5IDEwLjk1MzcgNC4wNTUyOSAxMC40MzUxTDIuMDkxNDQgOS45NDQxMkMxLjgxOTYyIDkuODc2MTYgMS42Mjg5MyA5LjYzMTkzIDEuNjI4OTMgOS4zNTE3NUMxLjYyODkzIDkuMDcxNTYgMS44MTk2MiA4LjgyNzMzIDIuMDkxNDQgOC43NTkzOEw0LjA1NTI5IDguMjY4NDJDNi4xMjk5IDcuNzQ5NzYgNy43NDk3NiA2LjEyOTkgOC4yNjg0MiA0LjA1NTI5TDguNzU5MzggMi4wOTE0NFpNMTcuMDY1OSAxMy40NDE5QzE3LjAwMSAxMy4xODIyIDE2Ljc2NzcgMTMgMTYuNSAxM0MxNi4yMzIzIDEzIDE1Ljk5OSAxMy4xODIyIDE1LjkzNDEgMTMuNDQxOUwxNS43MzI3IDE0LjI0NzJDMTUuNTQ5OSAxNC45Nzg3IDE0Ljk3ODcgMTUuNTQ5OSAxNC4yNDcyIDE1LjczMjdMMTMuNDQxOSAxNS45MzQxQzEzLjE4MjIgMTUuOTk5IDEzIDE2LjIzMjMgMTMgMTYuNUMxMyAxNi43Njc3IDEzLjE4MjIgMTcuMDAxIDEzLjQ0MTkgMTcuMDY1OUwxNC4yNDcyIDE3LjI2NzNDMTQuOTc4NyAxNy40NTAxIDE1LjU0OTkgMTguMDIxMyAxNS43MzI3IDE4Ljc1MjhMMTUuOTM0MSAxOS41NTgxQzE1Ljk5OSAxOS44MTc4IDE2LjIzMjMgMjAgMTYuNSAyMEMxNi43Njc3IDIwIDE3LjAwMSAxOS44MTc4IDE3LjA2NTkgMTkuNTU4MUwxNy4yNjczIDE4Ljc1MjhDMTcuNDUwMSAxOC4wMjEzIDE4LjAyMTMgMTcuNDUwMSAxOC43NTI4IDE3LjI2NzNMMTkuNTU4MSAxNy4wNjU5QzE5LjgxNzggMTcuMDAxIDIwIDE2Ljc2NzcgMjAgMTYuNUMyMCAxNi4yMzIzIDE5LjgxNzggMTUuOTk5IDE5LjU1ODEgMTUuOTM0MUwxOC43NTI4IDE1LjczMjdDMTguMDIxMyAxNS41NDk5IDE3LjQ1MDEgMTQuOTc4NyAxNy4yNjczIDE0LjI0NzJMMTcuMDY1OSAxMy40NDE5WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzI4MF81OTQ5KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzI4MF81OTQ5IiB4MT0iMTguOTYxMyIgeTE9IjE4LjYxODIiIHgyPSItMC4wMTMyNzg0IiB5Mj0iMC4wMjQxMzc0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMC4wMjYwNDE3IiBzdG9wLWNvbG9yPSIjRkE3MjUwIi8+CjxzdG9wIG9mZnNldD0iMC40MDEwNDIiIHN0b3AtY29sb3I9IiNGRjE4OTMiLz4KPHN0b3Agb2Zmc2V0PSIwLjk5NDc5MiIgc3RvcC1jb2xvcj0iI0E3OEFGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPiAg",
//              @"id": @"location",
//              @"text": @"Location"
//          },
//          @{
//              @"icon": @"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAErSURBVHgBvZWNEYIwDIWD5yCOwAiwAW6AG7gBMAmM4AawAW6gGzhCTc7Ahf6dbdF3J7208X1tWgrAj5XJQClVYFNAmu5Zlt2MXjTv1X7qdfOKB1pIFHmwV2F0QqDIhP9baf3rZI8QKS5DLeIBa3/R8w4QZ16xeYemdFA6ijdlSQGgcnqgdytbsJzAWMBED5xxI1vUbM12bTJ25eAQ1Vw7moMYWzf54DGgWc1idhthWWpszvCpf8kxfLUCMuVZjNw2ECC5AgMgzFs5JiGc88DfKQigmzvGl5yXC+IDGOauHDJmgAHxAazmWt5VxFaIdw9CZYNIQOyLtgqP5xObksNRL1cywAbZHWCBGICJHirwhXJAls/l9l5S5t2SomGFahC653NI04QrmeBfegPEpC4OSSpfkQAAAABJRU5ErkJggg==",
//              @"id": @"screenshot",
//              @"text": @"Screenshot"
//          },
//          @{
//              @"icon": @"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADSSURBVHgB7VTRCcJADE3BAeoGHcFNdAPdwG7QbqBO0G7gCHaD4gR1BJ0gvsOAIl5jAkd/+uDRwr33cuTuQjQjFZi5BStKBSnAkxdZKAEFPmtwGZHcwDtYQ/vIsuxIht3t2YazJXwnptCCfES3FV0/pvtlvICDovGFi3kAG0XTu8LFHFq0UjS5KzwWpqwXYEnO8CY0WtGUch4FecKBWtG12qVwhcs5HP7ZxLexYhuiLzg2Kq4f/yd6jYMYOoyIjqzg92v23XVrEUoFhG/YMshmWPEEwndJv9jtUaIAAAAASUVORK5CYII=",
//              @"id": @"swap-camera",
//              @"text": @"Swap camera"
//          },
//          @{
//              @"backgroundColor": @"red",
//              @"icon": @"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACESURBVHgB7ZRLDoAgDESL8b7iCfQIXtUTjDSyYMGnhe7gJSTGTOcl2kC0mBMARziXMu+leR7w+GlKOBOzN2nggZaku1wiGS6vSczKcxLz8oxEVb6RHBSex0k/CwTb1V2evLOR1H7osASCbemWQLGKiSR7F+2FuTec0zn3UIOQYQEtJuYDedv/MgzzIYUAAAAASUVORK5CYII=",
//              @"id": @"close",
//              @"text": @"Close",
//          }
//        ]];
//        [builder setConfigOverride:@"toolbarButtons" withArray:@[@"record", @"location", @"screenshot", @"swap-camera", @"close"]];
    }];

  [jitsiMeet application:application didFinishLaunchingWithOptions:launchOptions];

    // Initialize Crashlytics and Firebase if a valid GoogleService-Info.plist file was provided.
  if ([FIRUtilities appContainsRealServiceInfoPlist]) {
        NSLog(@"Enabling Firebase");
        [FIRApp configure];
        // Crashlytics defaults to disabled with the FirebaseCrashlyticsCollectionEnabled Info.plist key.
        [[FIRCrashlytics crashlytics] setCrashlyticsCollectionEnabled:![jitsiMeet isCrashReportingDisabled]];
    }

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

    if ([FIRUtilities appContainsRealServiceInfoPlist]) {
        // 1. Attempt to handle Universal Links through Firebase in order to support
        //    its Dynamic Links (which we utilize for the purposes of deferred deep
        //    linking).
        BOOL handled
          = [[FIRDynamicLinks dynamicLinks]
                handleUniversalLink:userActivity.webpageURL
                         completion:^(FIRDynamicLink * _Nullable dynamicLink, NSError * _Nullable error) {
           NSURL *firebaseUrl = [FIRUtilities extractURL:dynamicLink];
           if (firebaseUrl != nil) {
             userActivity.webpageURL = firebaseUrl;
             [[JitsiMeet sharedInstance] application:application
                                continueUserActivity:userActivity
                                  restorationHandler:restorationHandler];
           }
        }];

        if (handled) {
          return handled;
        }
    }

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

    if ([FIRUtilities appContainsRealServiceInfoPlist]) {
        // Process Firebase Dynamic Links
        FIRDynamicLink *dynamicLink = [[FIRDynamicLinks dynamicLinks] dynamicLinkFromCustomSchemeURL:url];
        NSURL *firebaseUrl = [FIRUtilities extractURL:dynamicLink];
        if (firebaseUrl != nil) {
            openUrl = firebaseUrl;
        }
    }

    return [[JitsiMeet sharedInstance] application:app
                                           openURL:openUrl
                                           options:options];
}

- (UIInterfaceOrientationMask)application:(UIApplication *)application
  supportedInterfaceOrientationsForWindow:(UIWindow *)window {
    return [[JitsiMeet sharedInstance] application:application
           supportedInterfaceOrientationsForWindow:window];
}

@end
