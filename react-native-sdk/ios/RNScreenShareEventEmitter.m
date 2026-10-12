/*
 * Copyright @ 2025-present 8x8, Inc.
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

/*
 * Observes the Darwin notifications which the Broadcast Upload Extension posts
 * when the user starts or stops a screen share, and forwards them to JS as a
 * single event. The JS side turns the event into toggleScreensharing().
 *
 * Compiled only by the RN SDK pod (jitsi-meet-rnsdk.podspec). The native iOS
 * SDK uses ScheenshareEventEmiter instead, which delivers through ExternalAPI.
 */

#import <React/RCTEventEmitter.h>

static NSString * const kScreenShareToggled = @"org.jitsi.meet:features/screen-share#toggled";

// The Broadcast Upload Extension posts these names. They must stay in sync with
// DarwinNotificationCenter.swift in the consumer's extension.
static NSString * const kBroadcastStartedNotification = @"iOS_BroadcastStarted";
static NSString * const kBroadcastStoppedNotification = @"iOS_BroadcastStopped";

// Info.plist keys which react-native-webrtc reads to find the App Group
// container and the Broadcast Upload Extension.
static NSString * const kRTCAppGroupIdentifier = @"RTCAppGroupIdentifier";
static NSString * const kRTCScreenSharingExtension = @"RTCScreenSharingExtension";

@interface RNScreenShareEventEmitter : RCTEventEmitter

- (void)emitScreenShareToggled:(BOOL)enabled;

@end

static void broadcastStartedNotificationCallback(CFNotificationCenterRef center,
                                                 void *observer,
                                                 CFStringRef name,
                                                 const void *object,
                                                 CFDictionaryRef userInfo);
static void broadcastStoppedNotificationCallback(CFNotificationCenterRef center,
                                                 void *observer,
                                                 CFStringRef name,
                                                 const void *object,
                                                 CFDictionaryRef userInfo);

@implementation RNScreenShareEventEmitter {
    CFNotificationCenterRef _notificationCenter;
    BOOL _observing;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
    }

    return self;
}

- (void)dealloc {
    [self stopObserving];
}

- (void)invalidate {
    [self stopObserving];
    [super invalidate];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ kScreenShareToggled ];
}

- (NSDictionary *)constantsToExport {
    NSDictionary *info = [[NSBundle mainBundle] infoDictionary];

    return @{
        @"SCREEN_SHARE_TOGGLED": kScreenShareToggled,
        @"appGroupIdentifier": info[kRTCAppGroupIdentifier] ?: [NSNull null],
        @"screenSharingExtension": info[kRTCScreenSharingExtension] ?: [NSNull null]
    };
}

// MARK: RCTEventEmitter

- (void)startObserving {
    if (_observing) {
        return;
    }

    _observing = YES;

    CFNotificationCenterAddObserver(_notificationCenter,
                                    (__bridge const void *)(self),
                                    broadcastStartedNotificationCallback,
                                    (__bridge CFStringRef)kBroadcastStartedNotification,
                                    NULL,
                                    CFNotificationSuspensionBehaviorDeliverImmediately);
    CFNotificationCenterAddObserver(_notificationCenter,
                                    (__bridge const void *)(self),
                                    broadcastStoppedNotificationCallback,
                                    (__bridge CFStringRef)kBroadcastStoppedNotification,
                                    NULL,
                                    CFNotificationSuspensionBehaviorDeliverImmediately);
}

- (void)stopObserving {
    if (!_observing) {
        return;
    }

    _observing = NO;

    CFNotificationCenterRemoveEveryObserver(_notificationCenter, (__bridge const void *)(self));
}

// MARK: Private Methods

- (void)emitScreenShareToggled:(BOOL)enabled {
    [self sendEventWithName:kScreenShareToggled body:@{ @"enabled": @(enabled) }];
}

@end

static void broadcastStartedNotificationCallback(CFNotificationCenterRef center,
                                                 void *observer,
                                                 CFStringRef name,
                                                 const void *object,
                                                 CFDictionaryRef userInfo) {
    [(__bridge RNScreenShareEventEmitter *)observer emitScreenShareToggled:YES];
}

static void broadcastStoppedNotificationCallback(CFNotificationCenterRef center,
                                                 void *observer,
                                                 CFStringRef name,
                                                 const void *object,
                                                 CFDictionaryRef userInfo) {
    [(__bridge RNScreenShareEventEmitter *)observer emitScreenShareToggled:NO];
}
