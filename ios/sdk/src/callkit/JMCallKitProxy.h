/*
 * Copyright @ 2022-present 8x8, Inc.
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

#import <CallKit/CallKit.h>
#import <Foundation/Foundation.h>
#import "JMCallKitListener.h"

NS_ASSUME_NONNULL_BEGIN

@protocol CXProviderProtocol <NSObject>

@property (nonatomic, readwrite, copy) CXProviderConfiguration* configuration;

- (void)setDelegate:(nullable id<CXProviderDelegate>)delegate queue:(nullable dispatch_queue_t)queue;
- (void)reportNewIncomingCallWithUUID:(NSUUID *)uuid update:(CXCallUpdate *)update completion:(void (^)(NSError *))completion;
- (void)reportCallWithUUID:(NSUUID *)uuid updated:(CXCallUpdate *)update;
- (void)reportCallWithUUID:(NSUUID *)uuid endedAtDate:(NSDate *)dateEnded reason:(CXCallEndedReason)endedReason;
- (void)reportOutgoingCallWithUUID:(NSUUID *)uuid startedConnectingAtDate:(NSDate *)dateStartedConnecting;
- (void)reportOutgoingCallWithUUID:(NSUUID *)uuid connectedAtDate:(NSDate *)dateConnected;
- (void)invalidate;

@end

#pragma mark -
@protocol CXCallControllerProtocol <NSObject>

@property (nonatomic, readonly) NSArray<CXCall*> *calls;

- (void)requestTransaction:(CXTransaction *)transaction completion:(void (^)(NSError *_Nullable))completion;

@end

#pragma mark -

/// JitsiMeet CallKit proxy
// NOTE: The methods this class exposes are meant to be called in the UI thread.
// All delegate methods called by JMCallKitEmitter will be called in the UI thread.
@interface JMCallKitProxy : NSObject

/// Enables the proxy in between CallKit and the consumers of the SDK.
/// Defaults to disabled. Set to true when you want to use CallKit.
@property (class) BOOL enabled;
@property (class) id<CXProviderProtocol> callKitProvider;
@property (class) id<CXCallControllerProtocol> callKitCallController;

+ (void)configureProviderWithLocalizedName:(nonnull NSString *)localizedName
                             ringtoneSound:(nullable NSString *)ringtoneSound
                    iconTemplateImageData:(nullable NSData*)imageData
NS_SWIFT_NAME(configureProvider(localizedName:ringtoneSound:iconTemplateImageData:));
+ (BOOL)isProviderConfigured;
+ (void)addListener:(nonnull id<JMCallKitListener>)listener NS_SWIFT_NAME(addListener(_:));
+ (void)removeListener:(nonnull id<JMCallKitListener>)listener NS_SWIFT_NAME(removeListener(_:));
+ (BOOL)hasActiveCallForUUID:(nonnull NSString *)callUUID NS_SWIFT_NAME(hasActiveCallForUUID(_:));
+ (void)reportNewIncomingCallWithUUID:(nonnull NSUUID *)uuid
                               handle:(nullable NSString*)handle
                          displayName:(nullable NSString*)displayName
                             hasVideo:(BOOL)hasVideo
                           completion:(nonnull void (^)(NSError *_Nullable))completion
NS_SWIFT_NAME(reportNewIncomingCall(UUID:handle:displayName:hasVideo:completion:));
+ (void)reportCallUpdateWith:(nonnull NSUUID *)uuid
                      handle:(nullable NSString *)handle
                 displayName:(nullable NSString *)displayName
                    hasVideo:(BOOL)hasVideo;
+ (void)reportCallWith:(nonnull NSUUID *)uuid
               endedAt:(nullable NSDate *)dateEnded
                reason:(CXCallEndedReason)endedReason;
+ (void)reportOutgoingCallWith:(nonnull NSUUID *)uuid startedConnectingAt:(nullable NSDate *)dateStartedConnecting;
+ (void)reportOutgoingCallWith:(nonnull NSUUID *)uuid connectedAt:(nullable NSDate *)dateConnected;
+ (void)request:(nonnull CXTransaction *)transaction completion:(nonnull void (^)(NSError *_Nullable))completion;

@end

NS_ASSUME_NONNULL_END
