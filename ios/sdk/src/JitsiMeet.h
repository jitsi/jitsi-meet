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

#import <JitsiMeet/JitsiMeetView.h>
#import <JitsiMeet/JitsiMeetViewDelegate.h>
#import <JitsiMeet/JitsiMeetConferenceOptions.h>


@interface JitsiMeet : NSObject

@property (copy, nonatomic, nullable) NSString *conferenceActivityType;
@property (copy, nonatomic, nullable) NSString *customUrlScheme;
@property (copy, nonatomic, nullable) NSArray<NSString *> *universalLinkDomains;

@property (nonatomic, nullable) JitsiMeetConferenceOptions *defaultConferenceOptions;

#pragma mak - This class is a singleton

+ (instancetype)sharedInstance;

#pragma mark - Methods that the App delegate must call

-             (BOOL)application:(UIApplication *_Nonnull)application
  didFinishLaunchingWithOptions:(NSDictionary *_Nonnull)launchOptions;

-    (BOOL)application:(UIApplication * _Nonnull)application
  continueUserActivity:(NSUserActivity * _Nonnull)userActivity
    restorationHandler:(void (^ _Nullable)(NSArray * _Nullable))restorationHandler;

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

#pragma mark - Utility methods

- (JitsiMeetConferenceOptions *)getInitialConferenceOptions;

@end
