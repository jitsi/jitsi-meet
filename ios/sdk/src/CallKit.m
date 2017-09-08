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

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>

// Weakly load CallKit, because it's not available on iOS 9.
@import CallKit;


// Events we will emit.
static NSString *const RNCallKitPerformAnswerCallAction = @"performAnswerCallAction";
static NSString *const RNCallKitPerformEndCallAction = @"performEndCallAction";
static NSString *const RNCallKitPerformSetMutedCallAction = @"performSetMutedCallAction";
static NSString *const RNCallKitProviderDidReset = @"providerDidReset";


@interface RNCallKit : RCTEventEmitter <CXProviderDelegate>
@end

@implementation RNCallKit
{
    CXCallController *callKitCallController;
    CXProvider *callKitProvider;
}

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
    return @[
        RNCallKitPerformAnswerCallAction,
        RNCallKitPerformEndCallAction,
        RNCallKitPerformSetMutedCallAction,
        RNCallKitProviderDidReset
    ];
}

// Configure CallKit
RCT_EXPORT_METHOD(setup:(NSDictionary *)options)
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][setup] options = %@", options);
#endif
    callKitCallController = [[CXCallController alloc] init];
    if (callKitProvider) {
        [callKitProvider invalidate];
    }
    callKitProvider = [[CXProvider alloc] initWithConfiguration:[self getProviderConfiguration: options]];
    [callKitProvider setDelegate:self queue:nil];
}

#pragma mark - CXCallController call actions

// Display the incoming call to the user
RCT_EXPORT_METHOD(displayIncomingCall:(NSString *)uuidString
                               handle:(NSString *)handle
                             hasVideo:(BOOL)hasVideo
                              resolve:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject)
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][displayIncomingCall] uuidString = %@", uuidString);
#endif
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
    callUpdate.remoteHandle
        = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    callUpdate.supportsDTMF = NO;
    callUpdate.supportsHolding = NO;
    callUpdate.supportsGrouping = NO;
    callUpdate.supportsUngrouping = NO;
    callUpdate.hasVideo = hasVideo;
    
    [callKitProvider reportNewIncomingCallWithUUID:uuid
                                            update:callUpdate
                                        completion:^(NSError * _Nullable error) {
        if (error == nil) {
            resolve(nil);
        } else {
            reject(nil, @"Error reporting new incoming call", error);
        }
    }];
}

// End call
RCT_EXPORT_METHOD(endCall:(NSString *)uuidString
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][endCall] uuidString = %@", uuidString);
#endif
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    CXEndCallAction *action = [[CXEndCallAction alloc] initWithCallUUID:uuid];
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:action];
    [self requestTransaction:transaction resolve:resolve reject:reject];
}

// Mute / unmute (audio)
RCT_EXPORT_METHOD(setMuted:(NSString *)uuidString
                  muted:(BOOL) muted
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][setMuted] uuidString = %@", uuidString);
#endif
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    CXSetMutedCallAction *action
    = [[CXSetMutedCallAction alloc] initWithCallUUID:uuid muted:muted];
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:action];
    [self requestTransaction:transaction resolve:resolve reject:reject];
}

// Start outgoing call
RCT_EXPORT_METHOD(startCall:(NSString *)uuidString
                     handle:(NSString *)handle
                      video:(BOOL)video
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject)
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][startCall] uuidString = %@", uuidString);
#endif
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    CXHandle *callHandle
        = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    CXStartCallAction *action
        = [[CXStartCallAction alloc] initWithCallUUID:uuid handle:callHandle];
    action.video = video;
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:action];
    [self requestTransaction:transaction resolve:resolve reject:reject];
}

// Indicate call failed
RCT_EXPORT_METHOD(reportCallFailed:(NSString *)uuidString
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    [callKitProvider reportCallWithUUID:uuid
                            endedAtDate:[NSDate date]
                                 reason:CXCallEndedReasonFailed];
    resolve(nil);
}

// Indicate outgoing call connected
RCT_EXPORT_METHOD(reportConnectedOutgoingCall:(NSString *)uuidString
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    [callKitProvider reportOutgoingCallWithUUID:uuid
                                connectedAtDate:[NSDate date]];
    resolve(nil);
}

// Update call in case we have a display name or video capability changes
RCT_EXPORT_METHOD(updateCall:(NSString *)uuidString
                     options:(NSDictionary *)options
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject)
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][updateCall] uuidString = %@ options = %@", uuidString, options);
#endif
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:uuidString];
    CXCallUpdate *update = [[CXCallUpdate alloc] init];
    if (options[@"displayName"]) {
        update.localizedCallerName = options[@"displayName"];
    }
    if (options[@"hasVideo"]) {
        update.hasVideo = [(NSNumber*)options[@"hasVideo"] boolValue];
    }
    [callKitProvider reportCallWithUUID:uuid updated:update];
    resolve(nil);
}

#pragma mark - Helper methods

- (CXProviderConfiguration *)getProviderConfiguration:(NSDictionary* )settings
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][getProviderConfiguration]");
#endif
    CXProviderConfiguration *providerConfiguration
        = [[CXProviderConfiguration alloc] initWithLocalizedName:settings[@"appName"]];
    providerConfiguration.supportsVideo = YES;
    providerConfiguration.maximumCallGroups = 1;
    providerConfiguration.maximumCallsPerCallGroup = 1;
    providerConfiguration.supportedHandleTypes
        = [NSSet setWithObjects:[NSNumber numberWithInteger:CXHandleTypeGeneric], nil];
    if (settings[@"imageName"]) {
        providerConfiguration.iconTemplateImageData
            = UIImagePNGRepresentation([UIImage imageNamed:settings[@"imageName"]]);
    }
    if (settings[@"ringtoneSound"]) {
        providerConfiguration.ringtoneSound = settings[@"ringtoneSound"];
    }
    return providerConfiguration;
}

- (void)requestTransaction:(CXTransaction *)transaction
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][requestTransaction] transaction = %@", transaction);
#endif
    [callKitCallController requestTransaction:transaction completion:^(NSError * _Nullable error) {
        if (error == nil) {
            resolve(nil);
        } else {
            NSLog(@"[RNCallKit][requestTransaction] Error requesting transaction (%@): (%@)", transaction.actions, error);
            reject(nil, @"Error processing CallKit transaction", error);
        }
    }];
}

#pragma mark - CXProviderDelegate

// Called when the provider has been reset. We should terminate all calls.
- (void)providerDidReset:(CXProvider *)provider {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:providerDidReset]");
#endif
    [self sendEventWithName:RNCallKitProviderDidReset body:nil];
}

// Answering incoming call
- (void)provider:(CXProvider *)provider performAnswerCallAction:(CXAnswerCallAction *)action
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performAnswerCallAction]");
#endif
    [self sendEventWithName:RNCallKitPerformAnswerCallAction
                       body:@{ @"callUUID": action.callUUID.UUIDString }];
    [action fulfill];
}

// Call ended, user request
- (void)provider:(CXProvider *)provider performEndCallAction:(CXEndCallAction *)action
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performEndCallAction]");
#endif
    [self sendEventWithName:RNCallKitPerformEndCallAction
                       body:@{ @"callUUID": action.callUUID.UUIDString }];
    [action fulfill];
}

// Handle audio mute from CallKit view
- (void)provider:(CXProvider *)provider performSetMutedCallAction:(CXSetMutedCallAction *)action {
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performSetMutedCallAction]");
#endif
    [self sendEventWithName:RNCallKitPerformSetMutedCallAction
                       body:@{ @"callUUID": action.callUUID.UUIDString,
                               @"muted": [NSNumber numberWithBool:action.muted]}];
    [action fulfill];
}

// Starting outgoing call
- (void)provider:(CXProvider *)provider performStartCallAction:(CXStartCallAction *)action
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:performStartCallAction]");
#endif
    [action fulfill];
    
    // Update call info
    CXCallUpdate *callUpdate = [[CXCallUpdate alloc] init];
    callUpdate.remoteHandle = action.handle;
    callUpdate.supportsDTMF = NO;
    callUpdate.supportsHolding = NO;
    callUpdate.supportsGrouping = NO;
    callUpdate.supportsUngrouping = NO;
    callUpdate.hasVideo = action.isVideo;
    [callKitProvider reportCallWithUUID:action.callUUID updated:callUpdate];
    
    // Notify the system about the outgoing call
    [callKitProvider reportOutgoingCallWithUUID:action.callUUID
                        startedConnectingAtDate:[NSDate date]];
}

// These just help with debugging

- (void)provider:(CXProvider *)provider didActivateAudioSession:(AVAudioSession *)audioSession
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:didActivateAudioSession]");
#endif
}

- (void)provider:(CXProvider *)provider didDeactivateAudioSession:(AVAudioSession *)audioSession
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:didDeactivateAudioSession]");
#endif
}

- (void)provider:(CXProvider *)provider timedOutPerformingAction:(CXAction *)action
{
#ifdef DEBUG
    NSLog(@"[RNCallKit][CXProviderDelegate][provider:timedOutPerformingAction]");
#endif
}

@end
