//
// Based on RNCallKit
//
// Original license:
//
// Copyright (c) 2016, Ian Yu-Hsun Lin
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
//

#import <AVFoundation/AVFoundation.h>
#import <CallKit/CallKit.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <WebRTC/WebRTC.h>

#import <JitsiMeet/JitsiMeet-Swift.h>

#import "LogUtils.h"


// The events emitted/supported by RNCallKit:
static NSString * const RNCallKitPerformAnswerCallAction
    = @"performAnswerCallAction";
static NSString * const RNCallKitPerformEndCallAction
    = @"performEndCallAction";
static NSString * const RNCallKitPerformSetMutedCallAction
    = @"performSetMutedCallAction";
static NSString * const RNCallKitProviderDidReset
    = @"providerDidReset";

@interface RNCallKit : RCTEventEmitter <JMCallKitListener>
@end

@implementation RNCallKit

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[
        RNCallKitPerformAnswerCallAction,
        RNCallKitPerformEndCallAction,
        RNCallKitPerformSetMutedCallAction,
        RNCallKitProviderDidReset
    ];
}

- (void)dealloc {
    [JMCallKitProxy removeListener:self];
}

- (dispatch_queue_t)methodQueue {
    // Make sure all our methods run in the main thread.
    return dispatch_get_main_queue();
}

// End call
RCT_EXPORT_METHOD(endCall:(NSString *)callUUID
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    DDLogInfo(@"[RNCallKit][endCall] callUUID = %@", callUUID);

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];

    if (!callUUID_) {
        reject(nil, [NSString stringWithFormat:@"Invalid UUID: %@", callUUID], nil);
        return;
    }

    CXEndCallAction *action
        = [[CXEndCallAction alloc] initWithCallUUID:callUUID_];
    [self requestTransaction:[[CXTransaction alloc] initWithAction:action]
                     resolve:resolve
                      reject:reject];
}

// Mute / unmute (audio)
RCT_EXPORT_METHOD(setMuted:(NSString *)callUUID
                     muted:(BOOL)muted
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject) {
    DDLogInfo(@"[RNCallKit][setMuted] callUUID = %@", callUUID);

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];

    if (!callUUID_) {
        reject(nil, [NSString stringWithFormat:@"Invalid UUID: %@", callUUID], nil);
        return;
    }

    CXSetMutedCallAction *action
        = [[CXSetMutedCallAction alloc] initWithCallUUID:callUUID_ muted:muted];
    [self requestTransaction:[[CXTransaction alloc] initWithAction:action]
                     resolve:resolve
                      reject:reject];
}

RCT_EXPORT_METHOD(setProviderConfiguration:(NSDictionary *)dictionary) {
    DDLogInfo(@"[RNCallKit][setProviderConfiguration:] dictionary = %@", dictionary);

    if (![JMCallKitProxy isProviderConfigured]) {
        [self configureProviderFromDictionary:dictionary];
    }

    // register to receive CallKit proxy events
    [JMCallKitProxy addListener:self];
}

// Start outgoing call
RCT_EXPORT_METHOD(startCall:(NSString *)callUUID
                     handle:(NSString *)handle
                      video:(BOOL)video
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject) {
    DDLogInfo(@"[RNCallKit][startCall] callUUID = %@", callUUID);

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];

    if (!callUUID_) {
        reject(nil, [NSString stringWithFormat:@"Invalid UUID: %@", callUUID], nil);
        return;
    }

    // Don't start a new call if there's an active call for the specified
    // callUUID. JitsiMeetView was configured for an incoming call.
    if ([JMCallKitProxy hasActiveCallForUUID:callUUID]) {
        resolve(nil);
        return;
    }

    CXHandle *handle_
        = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    CXStartCallAction *action
        = [[CXStartCallAction alloc] initWithCallUUID:callUUID_
                                               handle:handle_];
    action.video = video;
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:action];
    [self requestTransaction:transaction resolve:resolve reject:reject];
}

// Indicate call failed
RCT_EXPORT_METHOD(reportCallFailed:(NSString *)callUUID
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject) {
    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];

    if (!callUUID_) {
        reject(nil, [NSString stringWithFormat:@"Invalid UUID: %@", callUUID], nil);
        return;
    }

    [JMCallKitProxy reportCallWith:callUUID_
                           endedAt:nil
                            reason:CXCallEndedReasonFailed];
    resolve(nil);
}

// Indicate outgoing call connected.
RCT_EXPORT_METHOD(reportConnectedOutgoingCall:(NSString *)callUUID
                                      resolve:(RCTPromiseResolveBlock)resolve
                                       reject:(RCTPromiseRejectBlock)reject) {
    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];

    if (!callUUID_) {
        reject(nil, [NSString stringWithFormat:@"Invalid UUID: %@", callUUID], nil);
        return;
    }

    [JMCallKitProxy reportOutgoingCallWith:callUUID_
                               connectedAt:nil];
    resolve(nil);
}

// Update call in case we have a display name or video capability changes.
RCT_EXPORT_METHOD(updateCall:(NSString *)callUUID
                     options:(NSDictionary *)options
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject) {
    DDLogInfo(@"[RNCallKit][updateCall] callUUID = %@ options = %@", callUUID, options);

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];

    if (!callUUID_) {
        reject(nil, [NSString stringWithFormat:@"Invalid UUID: %@", callUUID], nil);
        return;
    }

    NSString *displayName = options[@"displayName"];
    BOOL hasVideo = [(NSNumber*)options[@"hasVideo"] boolValue];

    [JMCallKitProxy reportCallUpdateWith:callUUID_
                                  handle:nil
                             displayName:displayName
                                hasVideo:hasVideo];

    resolve(nil);
}

#pragma mark - Helper methods

- (void)configureProviderFromDictionary:(NSDictionary* )dictionary {
    DDLogInfo(@"[RNCallKit][providerConfigurationFromDictionary: %@]", dictionary);

    if (!dictionary) {
        dictionary = @{};
    }

    // localizedName
    NSString *localizedName = dictionary[@"localizedName"];
    if (!localizedName) {
        localizedName
            = [[NSBundle mainBundle] infoDictionary][@"CFBundleDisplayName"];
    }

    // iconTemplateImageData
    NSString *iconTemplateImageName = dictionary[@"iconTemplateImageName"];
    NSData *iconTemplateImageData;
    UIImage *iconTemplateImage;
    if (iconTemplateImageName) {
        // First try to load the resource from the main bundle.
        iconTemplateImage = [UIImage imageNamed:iconTemplateImageName];

        // If that didn't work, use the one built-in.
        if (!iconTemplateImage) {
            iconTemplateImage = [UIImage imageNamed:iconTemplateImageName
                                           inBundle:[NSBundle bundleForClass:self.class]
                      compatibleWithTraitCollection:nil];
        }

        if (iconTemplateImage) {
            iconTemplateImageData = UIImagePNGRepresentation(iconTemplateImage);
        }
    }

    NSString *ringtoneSound = dictionary[@"ringtoneSound"];

    [JMCallKitProxy
        configureProviderWithLocalizedName:localizedName
                             ringtoneSound:ringtoneSound
                     iconTemplateImageData:iconTemplateImageData];
}

- (void)requestTransaction:(CXTransaction *)transaction
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    DDLogInfo(@"[RNCallKit][requestTransaction] transaction = %@", transaction);

    [JMCallKitProxy request:transaction
                 completion:^(NSError * _Nullable error) {
        if (error) {
            DDLogError(@"[RNCallKit][requestTransaction] Error requesting transaction (%@): (%@)", transaction.actions, error);
            reject(nil, @"Error processing CallKit transaction", error);
        } else {
            resolve(nil);
        }
    }];
}

#pragma mark - JMCallKitListener

// Called when the provider has been reset. We should terminate all calls.
- (void)providerDidReset {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][providerDidReset:]");

    [self sendEventWithName:RNCallKitProviderDidReset body:nil];
}

// Answering incoming call
- (void) performAnswerCallWithUUID:(NSUUID *)UUID {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][provider:performAnswerCallAction:]");

    [self sendEventWithName:RNCallKitPerformAnswerCallAction
                       body:@{ @"callUUID": UUID.UUIDString }];
}

// Call ended, user request
- (void) performEndCallWithUUID:(NSUUID *)UUID {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][provider:performEndCallAction:]");

    [self sendEventWithName:RNCallKitPerformEndCallAction
                       body:@{ @"callUUID": UUID.UUIDString }];
}

// Handle audio mute from CallKit view
- (void) performSetMutedCallWithUUID:(NSUUID *)UUID
                             isMuted:(BOOL)isMuted {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][provider:performSetMutedCallAction:]");

    [self sendEventWithName:RNCallKitPerformSetMutedCallAction
                       body:@{
                           @"callUUID": UUID.UUIDString,
                           @"muted": @(isMuted)
                       }];
}

// Starting outgoing call
- (void) performStartCallWithUUID:(NSUUID *)UUID
                          isVideo:(BOOL)isVideo {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][provider:performStartCallAction:]");

    [JMCallKitProxy reportOutgoingCallWith:UUID
                       startedConnectingAt:nil];
}

- (void) providerDidActivateAudioSessionWithSession:(AVAudioSession *)session {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][provider:didActivateAudioSession:]");

    [[RTCAudioSession sharedInstance] audioSessionDidActivate:session];
}

- (void) providerDidDeactivateAudioSessionWithSession:(AVAudioSession *)session {
    DDLogInfo(@"[RNCallKit][CXProviderDelegate][provider:didDeactivateAudioSession:]");

    [[RTCAudioSession sharedInstance] audioSessionDidDeactivate:session];
}

- (void) providerTimedOutPerformingActionWithAction:(CXAction *)action {
    DDLogWarn(@"[RNCallKit][CXProviderDelegate][provider:timedOutPerformingAction:]");
}


// The bridge might already be invalidated by the time a CallKit event is processed,
// just ignore it and don't emit it.
- (void)sendEventWithName:(NSString *)name body:(id)body {
    if (!self.bridge) {
        return;
    }

    [super sendEventWithName:name body:body];
}

@end
