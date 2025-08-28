/*
 * Copyright @ 2017-present 8x8, Inc.
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

#import <AVFoundation/AVFoundation.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>

#import "InfoPlistUtil.h"

@interface AppInfo : NSObject<RCTBridgeModule>
@end

@implementation AppInfo

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (NSDictionary *)constantsToExport {
    NSDictionary<NSString *, id> *infoDictionary
        = [[NSBundle mainBundle] infoDictionary];

    // calendarEnabled
    BOOL calendarEnabled = NO;
#if !defined(JITSI_MEET_SDK_LITE)
    calendarEnabled = infoDictionary[@"NSCalendarsUsageDescription"] != nil;
#endif

    // name
    NSString *name = infoDictionary[@"CFBundleDisplayName"];

    if (name == nil) {
        name = infoDictionary[@"CFBundleName"];
        if (name == nil) {
            name = @"";
        }
    }

    // sdkBundlePath
    NSString *sdkBundlePath = [[NSBundle bundleForClass:self.class] bundlePath];

    // version
    NSString *version = infoDictionary[@"CFBundleShortVersionString"];

    if (version == nil) {
        version = infoDictionary[@"CFBundleVersion"];
        if (version == nil) {
            version = @"";
        }
    }

    // SDK version
    NSDictionary<NSString *, id> *sdkInfoDictionary
        = [[NSBundle bundleForClass:self.class] infoDictionary];
    NSString *sdkVersion = sdkInfoDictionary[@"CFBundleShortVersionString"];
    if (sdkVersion == nil) {
        sdkVersion = @"";
    }

    // build number
    NSString *buildNumber = infoDictionary[@"CFBundleVersion"];
    if (buildNumber == nil) {
        buildNumber = @"";
    }

    // google services (sign in)
    BOOL isGoogleServiceEnabled = [InfoPlistUtil containsRealServiceInfoPlistInBundle:[NSBundle mainBundle]];
    
    // lite SDK
    BOOL isLiteSDK = NO;
#if defined(JITSI_MEET_SDK_LITE)
    isLiteSDK = YES;
#endif

    return @{
        @"calendarEnabled": [NSNumber numberWithBool:calendarEnabled],
        @"buildNumber": buildNumber,
        @"isLiteSDK": [NSNumber numberWithBool:isLiteSDK],
        @"name": name,
        @"sdkBundlePath": sdkBundlePath,
        @"sdkVersion": sdkVersion,
        @"version": version,
        @"GOOGLE_SERVICES_ENABLED": [NSNumber numberWithBool:isGoogleServiceEnabled]
    };
};
@end
