/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

#include <Availability.h>
#import <Foundation/Foundation.h>

#import <JitsiMeet/JitsiMeet.h>

// Weakly load the Intents framework since it's not available on iOS 9.
@import Intents;

// Constant describing iOS 10.0.0
static const NSOperatingSystemVersion ios10 = {
  .majorVersion = 10,
  .minorVersion = 0,
  .patchVersion = 0
};


@implementation AppDelegate

-             (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    return [JitsiMeetView application:application
        didFinishLaunchingWithOptions:launchOptions];
}

#pragma mark Linking delegate methods

-   (BOOL)application:(UIApplication *)application
 continueUserActivity:(NSUserActivity *)userActivity
   restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler {

  JitsiMeetView *view = (JitsiMeetView *) self.window.rootViewController.view;
  if (!view) {
      return NO;
  }

  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
      [view loadURL:userActivity.webpageURL];

      return YES;
  }

  // Check for CallKit intents only on iOS >= 10
  if ([[NSProcessInfo processInfo] isOperatingSystemAtLeastVersion:ios10]) {
      if ([userActivity.activityType isEqualToString:@"INStartAudioCallIntent"]
          || [userActivity.activityType isEqualToString:@"INStartVideoCallIntent"]) {
          INInteraction *interaction = [userActivity interaction];
          INIntent *intent = interaction.intent;
          NSString *handle;
          BOOL isAudio = NO;

          if ([intent isKindOfClass:[INStartAudioCallIntent class]]) {
              INStartAudioCallIntent *startCallIntent
                  = (INStartAudioCallIntent *)intent;
              handle = startCallIntent.contacts.firstObject.personHandle.value;
              isAudio = YES;
          } else {
              INStartVideoCallIntent *startCallIntent
                  = (INStartVideoCallIntent *)intent;
              handle = startCallIntent.contacts.firstObject.personHandle.value;
          }

          if (!handle) {
              return NO;
          }

          // Load the URL contained in the handle
          [view loadURLObject:@{
                                @"url": handle,
                                @"configOverwrite": @{
                                    @"startAudioOnly": @(isAudio)
                                }
                                }];

          return YES;
      }
  }

  return NO;
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {

    JitsiMeetView *view = (JitsiMeetView *) self.window.rootViewController.view;
    [view loadURL:url];

    return YES;
}

@end
