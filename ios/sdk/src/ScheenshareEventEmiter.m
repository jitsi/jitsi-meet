/*
 * Copyright @ 2021-present 8x8, Inc.
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

#import "ScheenshareEventEmiter.h"
#import <React/RCTLog.h>
#import <React/RCTBridge.h>

NSNotificationName const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
NSNotificationName const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

static NSString * const toggleScreenShareAction = @"org.jitsi.meet.TOGGLE_SCREEN_SHARE";


@implementation ScheenshareEventEmiter {
    CFNotificationCenterRef _notificationCenter;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSDictionary *)constantsToExport {
    return @{
        @"TOGGLE_SCREEN_SHARE": toggleScreenShareAction,
    };
};

- (NSArray<NSString *> *)supportedEvents {
    return @[toggleScreenShareAction];
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
        [self setupObserver];
    }
    
    return self;
}

- (void)dealloc {
    [self clearObserver];
}

// MARK: Private Methods

- (void)setupObserver {
    CFNotificationCenterAddObserver(_notificationCenter, (__bridge const void *)(self), broadcastStartedNotificationCallback, (__bridge CFStringRef)kBroadcastStartedNotification, NULL, CFNotificationSuspensionBehaviorDeliverImmediately);
    CFNotificationCenterAddObserver(_notificationCenter, (__bridge const void *)(self), broadcastStoppedNotificationCallback, (__bridge CFStringRef)kBroadcastStoppedNotification, NULL, CFNotificationSuspensionBehaviorDeliverImmediately);
}

- (void)clearObserver {
    CFNotificationCenterRemoveObserver(_notificationCenter, (__bridge const void *)(self), (__bridge CFStringRef)kBroadcastStartedNotification, NULL);
    CFNotificationCenterRemoveObserver(_notificationCenter, (__bridge const void *)(self), (__bridge CFStringRef)kBroadcastStoppedNotification, NULL);
}

void broadcastStartedNotificationCallback(CFNotificationCenterRef center,
                                          void *observer,
                                          CFStringRef name,
                                          const void *object,
                                          CFDictionaryRef userInfo) {
    ScheenshareEventEmiter *self = (__bridge ScheenshareEventEmiter *)observer;
    if (self.bridge) {        
        [self sendEventWithName:toggleScreenShareAction body:@{@"enabled": @TRUE}];
    }
}

void broadcastStoppedNotificationCallback(CFNotificationCenterRef center,
                                          void *observer,
                                          CFStringRef name,
                                          const void *object,
                                          CFDictionaryRef userInfo) {
    ScheenshareEventEmiter *self = (__bridge ScheenshareEventEmiter *)observer;
    if (self.bridge) {
        [self sendEventWithName:toggleScreenShareAction body:@{@"enabled": @FALSE}];
    }
}

@end
