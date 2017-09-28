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
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@import CallKit;

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>

// The events emitted/supported by RNCallKit:
static NSString * const RNCallKitPerformAnswerCallAction
    = @"performAnswerCallAction";
static NSString * const RNCallKitPerformEndCallAction
    = @"performEndCallAction";
static NSString * const RNCallKitPerformSetMutedCallAction
    = @"performSetMutedCallAction";
static NSString * const RNCallKitProviderDidReset
    = @"providerDidReset";

@interface RNCallKit : RCTEventEmitter <CXProviderDelegate>
@end

@implementation RNCallKit
{
    CXCallController *_callController;
    CXProvider *_provider;
}

RCT_EXTERN void RCTRegisterModule(Class);

+ (void)load {
    // Make the react-native module RNCallKit available (to JS) only if CallKit
    // is available on the executing operating sytem. For example, CallKit is
    // not available on iOS 9.
    if ([CXCallController class]) {
        RCTRegisterModule(self);
    }
}

+ (NSString *)moduleName {
    return @"RNCallKit";
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        RNCallKitPerformAnswerCallAction,
        RNCallKitPerformEndCallAction,
        RNCallKitPerformSetMutedCallAction,
        RNCallKitProviderDidReset
    ];
}

// Display the incoming call to the user
RCT_EXPORT_METHOD(displayIncomingCall:(NSString *)callUUID
                               handle:(NSString *)handle
                             hasVideo:(BOOL)hasVideo
                              resolve:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject) {
#ifdef DEBUG
    NSLog(@"[RNCallKit][displayIncomingCall] callUUID = %@", callUUID);
#endif

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];
    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
    callUpdate.remoteHandle
        = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    callUpdate.supportsDTMF = NO;
    callUpdate.supportsHolding = NO;
    callUpdate.supportsGrouping = NO;
    callUpdate.supportsUngrouping = NO;
    callUpdate.hasVideo = hasVideo;

    [self.provider reportNewIncomingCallWithUUID:callUUID_
                                          update:callUpdate
                                      completion:^(NSError * _Nullable error) {
        if (error) {
            reject(nil, @"Error reporting new incoming call", error);
        } else {
            resolve(nil);
        }
    }];
}

// End call
RCT_EXPORT_METHOD(endCall:(NSString *)callUUID
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
#ifdef DEBUG
    NSLog(@"[RNCallKit][endCall] callUUID = %@", callUUID);
#endif

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];
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
#ifdef DEBUG
    NSLog(@"[RNCallKit][setMuted] callUUID = %@", callUUID);
#endif

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];
    CXSetMutedCallAction *action
        = [[CXSetMutedCallAction alloc] initWithCallUUID:callUUID_ muted:muted];
    [self requestTransaction:[[CXTransaction alloc] initWithAction:action]
                     resolve:resolve
                      reject:reject];
}

RCT_EXPORT_METHOD(setProviderConfiguration:(NSDictionary *)dictionary) {
#ifdef DEBUG
    NSLog(
        @"[RNCallKit][setProviderConfiguration:] dictionary = %@",
        dictionary);
#endif

    CXProviderConfiguration *configuration
        = [self providerConfigurationFromDictionary:dictionary];
    if (_provider) {
        _provider.configuration = configuration;
    } else {
        _provider = [[CXProvider alloc] initWithConfiguration:configuration];
        [_provider setDelegate:self queue:nil];
    }
}

// Start outgoing call
RCT_EXPORT_METHOD(startCall:(NSString *)callUUID
                     handle:(NSString *)handle
                      video:(BOOL)video
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject) {
#ifdef DEBUG
    NSLog(@"[RNCallKit][startCall] callUUID = %@", callUUID);
#endif

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];
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
    [self.provider reportCallWithUUID:callUUID_
                          endedAtDate:[NSDate date]
                               reason:CXCallEndedReasonFailed];
    resolve(nil);
}

// Indicate outgoing call connected.
RCT_EXPORT_METHOD(reportConnectedOutgoingCall:(NSString *)callUUID
                                      resolve:(RCTPromiseResolveBlock)resolve
                                       reject:(RCTPromiseRejectBlock)reject) {
    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];
    [self.provider reportOutgoingCallWithUUID:callUUID_
                              connectedAtDate:[NSDate date]];
    resolve(nil);
}

// Update call in case we have a display name or video capability changes.
RCT_EXPORT_METHOD(updateCall:(NSString *)callUUID
                     options:(NSDictionary *)options
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject) {
#ifdef DEBUG
    NSLog(
        @"[RNCallKit][updateCall] callUUID = %@ options = %@",
        callUUID,
        options);
#endif

    NSUUID *callUUID_ = [[NSUUID alloc] initWithUUIDString:callUUID];
    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
    if (options[@"displayName"]) {
        callUpdate.localizedCallerName = options[@"displayName"];
    }
    if (options[@"hasVideo"]) {
        callUpdate.hasVideo = [(NSNumber*)options[@"hasVideo"] boolValue];
    }
    [self.provider reportCallWithUUID:callUUID_ updated:callUpdate];
    resolve(nil);
}

#pragma mark - Helper methods

- (CXCallController *)callController {
    if (!_callController) {
        _callController = [[CXCallController alloc] init];
    }

    return _callController;
}

- (CXProvider *)provider {
    if (!_provider) {
        [self setProviderConfiguration:nil];
    }

    return _provider;
}

- (CXProviderConfiguration *)providerConfigurationFromDictionary:(NSDictionary* )dictionary {
#ifdef DEBUG
    NSLog(@"[RNCallKit][providerConfigurationFromDictionary:]");
#endif

    if (!dictionary) {
        dictionary = @{};
    }

    // localizedName
    NSString *localizedName = dictionary[@"localizedName"];
    if (!localizedName) {
        localizedName
            = [[NSBundle mainBundle] infoDictionary][@"CFBundleDisplayName"];
    }

    CXProviderConfiguration *providerConfiguration
        = [[CXProviderConfiguration alloc] initWithLocalizedName:localizedName];

    // iconTemplateImageData
    NSString *iconTemplateImageName = dictionary[@"iconTemplateImageName"];
    if (iconTemplateImageName) {
        UIImage *iconTemplateImage = [UIImage imageNamed:iconTemplateImageName];
        if (iconTemplateImage) {
            providerConfiguration.iconTemplateImageData
                = UIImagePNGRepresentation(iconTemplateImage);
        }
    }

    providerConfiguration.maximumCallGroups = 1;
    providerConfiguration.maximumCallsPerCallGroup = 1;
    providerConfiguration.ringtoneSound = dictionary[@"ringtoneSound"];
    providerConfiguration.supportedHandleTypes
        = [NSSet setWithObjects:@(CXHandleTypeGeneric), nil];
    providerConfiguration.supportsVideo = YES;

    return providerConfiguration;
}

- (void)requestTransaction:(CXTransaction *)transaction
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
#ifdef DEBUG
    NSLog(@"[RNCallKit][requestTransaction] transaction = %@", transaction);
#endif

    [self.callController requestTransaction:transaction
                                 completion:^(NSError * _Nullable error) {
        if (error) {
            NSLog(
                @"[RNCallKit][requestTransaction] Error requesting transaction (%@): (%@)",
                transaction.actions,
                error);
            reject(nil, @"Error processing CallKit transaction", error);
        } else {
            resolve(nil);
        }
    }];
}

#pragma mark - CXProviderDelegate

// Called when the provider has been reset. We should terminate all calls.
- (void)providerDidReset:(CXProvider *)provider {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][providerDidReset:]");
#endif

    [self sendEventWithName:RNCallKitProviderDidReset body:nil];
}

// Answering incoming call
- (void)         provider:(CXProvider *)provider
  performAnswerCallAction:(CXAnswerCallAction *)action {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performAnswerCallAction:]");
#endif

    [self sendEventWithName:RNCallKitPerformAnswerCallAction
                       body:@{ @"callUUID": action.callUUID.UUIDString }];
    [action fulfill];
}

// Call ended, user request
- (void)      provider:(CXProvider *)provider
  performEndCallAction:(CXEndCallAction *)action {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performEndCallAction:]");
#endif

    [self sendEventWithName:RNCallKitPerformEndCallAction
                       body:@{ @"callUUID": action.callUUID.UUIDString }];
    [action fulfill];
}

// Handle audio mute from CallKit view
- (void)           provider:(CXProvider *)provider
  performSetMutedCallAction:(CXSetMutedCallAction *)action {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performSetMutedCallAction:]");
#endif

    [self sendEventWithName:RNCallKitPerformSetMutedCallAction
                       body:@{
                           @"callUUID": action.callUUID.UUIDString,
                           @"muted": @(action.muted)
                       }];
    [action fulfill];
}

// Starting outgoing call
- (void)        provider:(CXProvider *)provider
  performStartCallAction:(CXStartCallAction *)action {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performStartCallAction:]");
#endif

    [action fulfill];

    // Update call info.
    NSUUID *callUUID = action.callUUID;
    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
    callUpdate.remoteHandle = action.handle;
    callUpdate.supportsDTMF = NO;
    callUpdate.supportsHolding = NO;
    callUpdate.supportsGrouping = NO;
    callUpdate.supportsUngrouping = NO;
    callUpdate.hasVideo = action.isVideo;
    [provider reportCallWithUUID:callUUID updated:callUpdate];

    // Notify the system about the outgoing call.
    [provider reportOutgoingCallWithUUID:callUUID
                 startedConnectingAtDate:[NSDate date]];
}

// The following just help with debugging:
#ifdef DEBUG

- (void)         provider:(CXProvider *)provider
  didActivateAudioSession:(AVAudioSession *)audioSession {
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:didActivateAudioSession:]");
}

- (void)           provider:(CXProvider *)provider
  didDeactivateAudioSession:(AVAudioSession *)audioSession {
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:didDeactivateAudioSession:]");
}

- (void)          provider:(CXProvider *)provider
  timedOutPerformingAction:(CXAction *)action {
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:timedOutPerformingAction:]");
}

#endif

@end
