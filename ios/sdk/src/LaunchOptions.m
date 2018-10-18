/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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

#import "JitsiMeetView+Private.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

@interface LaunchOptions : NSObject<RCTBridgeModule>

@property (nonatomic, weak) RCTBridge *bridge;

@end

@implementation LaunchOptions

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(getInitialURL:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject) {
    id initialURL = nil;

    if (self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey]) {
        NSURL *url = self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey];
        initialURL = url.absoluteString;
    } else {
        NSDictionary *userActivityDictionary
            = self.bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];
        NSUserActivity *userActivity
            = [userActivityDictionary objectForKey:@"UIApplicationLaunchOptionsUserActivityKey"];
        if (userActivity != nil) {
            initialURL = [JitsiMeetView conferenceURLFromUserActivity:userActivity];
        }
    }

    resolve(initialURL != nil ? initialURL : (id)kCFNull);
}

@end
