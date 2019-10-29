/*
 * Copyright @ 2018-present 8x8, Inc.
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

#import <React/RCTBridgeModule.h>

#import "Amplitude.h"
#import "LogUtils.h"


@interface AmplitudeModule : NSObject<RCTBridgeModule>
@end

@implementation AmplitudeModule

RCT_EXPORT_MODULE(Amplitude)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

RCT_EXPORT_METHOD(init:(NSString*)instanceName API_KEY:(NSString*)apiKey) {
    [[Amplitude instanceWithName:instanceName] initializeApiKey:apiKey];
}

RCT_EXPORT_METHOD(setUserId:(NSString*)instanceName userId: (NSString *) userId) {
    [[Amplitude instanceWithName:instanceName] setUserId:userId];
}

RCT_EXPORT_METHOD(setUserProperties:(NSString*)instanceName userPropsString:(NSDictionary*)userProps) {
    if (userProps != nil) {
        [[Amplitude instanceWithName:instanceName] setUserProperties:userProps];
    }
}

RCT_EXPORT_METHOD(logEvent:(NSString*)instanceName eventType:(NSString*)eventType eventPropsString:(NSString*)eventPropsString) {
    NSError *error;
    NSData *eventPropsData = [eventPropsString dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *eventProperties = [NSJSONSerialization JSONObjectWithData:eventPropsData
                                                                   options:NSJSONReadingMutableContainers
                                                                     error:&error];
    if (eventProperties == nil) {
        DDLogError(@"[Amplitude] Error parsing event properties: %@", error);
    } else {
        [[Amplitude instanceWithName:instanceName] logEvent:eventType withEventProperties:eventProperties];
    }
}

@end
