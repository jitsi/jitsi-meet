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

#import <Intents/Intents.h>

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
            NSString *activityType = userActivity.activityType;

            if ([activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
                // App was started by opening a URL in the browser
                initialURL = userActivity.webpageURL.absoluteString;
            } else if ([activityType isEqualToString:@"INStartAudioCallIntent"]
                       || [activityType isEqualToString:@"INStartVideoCallIntent"]) {
                // App was started by a CallKit Intent
                INIntent *intent = userActivity.interaction.intent;
                NSArray<INPerson *> *contacts;
                NSString *url;
                BOOL startAudioOnly = NO;

                if ([intent isKindOfClass:[INStartAudioCallIntent class]]) {
                    contacts = ((INStartAudioCallIntent *) intent).contacts;
                    startAudioOnly = YES;
                } else if ([intent isKindOfClass:[INStartVideoCallIntent class]]) {
                    contacts = ((INStartVideoCallIntent *) intent).contacts;
                }

                if (contacts && (url = contacts.firstObject.personHandle.value)) {
                    initialURL
                        = @{
                            @"config": @{@"startAudioOnly":@(startAudioOnly)},
                            @"url": url
                            };
                }
            }
        }
    }

    resolve(initialURL != nil ? initialURL : (id)kCFNull);
}

@end

