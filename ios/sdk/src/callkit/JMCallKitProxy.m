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

#import "JMCallKitProxy.h"
#import "JMCallKitEmitter.h"

#pragma mark -
@interface CXProvider(CXProviderProtocol) <CXProviderProtocol>
@end

@implementation CXProvider(CXProviderProtocol)
@end

#pragma mark -
@interface CXCallController(CXCallControllerProtocol) <CXCallControllerProtocol>

@property (nonatomic, readonly) NSArray<CXCall*> *calls;

@end

@implementation CXCallController(CXCallControllerProtocol)

@dynamic calls;

- (NSArray<CXCall*> *)calls {
    return self.callObserver.calls;
}

@end

#pragma mark -
@interface JMCallKitProxy ()
    
@property (class) CXProvider *defaultProvider;
@property (class) CXProviderConfiguration *providerConfiguration;

@end

@interface JMCallKitProxy (Helpers)

+ (CXCallUpdate *)makeCXUpdateWithHandle:(nullable NSString *)handle displayName:(nullable NSString *)displayName hasVideo:(BOOL)hasVideo;

@end

@implementation JMCallKitProxy

@dynamic callKitProvider, callKitCallController, enabled;
@dynamic defaultProvider, providerConfiguration;

static id<CXProviderProtocol> _callKitProvider = nil;
static id<CXCallControllerProtocol> _callKitCallController = nil;
static BOOL _enabled = false;
static CXProvider *_defaultProvider = nil;
static CXProviderConfiguration *_providerConfiguration = nil;

#pragma mark CallJit proxy

+ (id<CXProviderProtocol>)callKitProvider {
    return _callKitProvider;
}

+ (void)setCallKitProvider:(id<CXProviderProtocol>)callKitProvider {
    if (_callKitProvider != callKitProvider) {
        _callKitProvider = callKitProvider;
    }
}

+ (id<CXCallControllerProtocol>)callKitCallController {
    return  _callKitCallController;
}

+ (void)setCallKitCallController:(id<CXCallControllerProtocol>)callKitCallController {
    if (_callKitCallController != callKitCallController) {
        _callKitCallController = callKitCallController;
    }
}

+ (BOOL)enabled {
    return _enabled;
}

+ (void)setEnabled:(BOOL)enabled {
    _enabled = enabled ;
    
    if (!self.callKitProvider) {
        [self.provider invalidate];
    }
    
    if (enabled) {
        CXProviderConfiguration *configuration = self.providerConfiguration? self.providerConfiguration : [[CXProviderConfiguration alloc] initWithLocalizedName:@""];
        if (!self.callKitProvider) {
            self.defaultProvider = [[CXProvider alloc] initWithConfiguration: configuration];
        }
        
        [self.provider setDelegate:self.emitter queue:nil];
    } else {
        [self.provider setDelegate:nil queue:nil];
    }
}

+ (CXProvider *)defaultProvider {
    return _defaultProvider;
}

+ (void)setDefaultProvider:(CXProvider *)defaultProvider {
    if (_defaultProvider != defaultProvider) {
        _defaultProvider = defaultProvider;
    }
}

+ (id<CXProviderProtocol>)provider {
    return self.callKitProvider != nil ? self.callKitProvider : self.defaultProvider;
}

+ (id<CXCallControllerProtocol>)callController {
    return self.callKitCallController != nil ? self.callKitCallController : self.defaultCallController;
}

+ (CXProviderConfiguration *)providerConfiguration {
    return _providerConfiguration;
}

+ (void)setProviderConfiguration:(CXProviderConfiguration *)providerConfiguration {
    if (_providerConfiguration != providerConfiguration) {
        _providerConfiguration = providerConfiguration;
        
        if (providerConfiguration) {
            self.provider.configuration = providerConfiguration;
            [self.provider setDelegate:self.emitter queue:nil];
        }
    }
}

+ (CXCallController *)defaultCallController {
    static dispatch_once_t once;
    static CXCallController *defaultCallController;
    dispatch_once(&once, ^{
        defaultCallController = [[CXCallController alloc] init];
    });
    
    return defaultCallController;
}

+ (JMCallKitEmitter *)emitter {
    static dispatch_once_t once;
    static JMCallKitEmitter *emitter;
    dispatch_once(&once, ^{
        emitter = [[JMCallKitEmitter alloc] init];
    });
    
    return emitter;
}

+ (void)configureProviderWithLocalizedName:(nonnull NSString *)localizedName
                             ringtoneSound:(nullable NSString *)ringtoneSound
                    iconTemplateImageData:(nullable NSData*)imageData {
    if (!self.enabled) {
        return;
    }
    
    CXProviderConfiguration *configuration = [[CXProviderConfiguration alloc] initWithLocalizedName:localizedName];
    configuration.iconTemplateImageData = imageData;
    configuration.maximumCallGroups = 1;
    configuration.maximumCallsPerCallGroup = 1;
    configuration.ringtoneSound = ringtoneSound;
    configuration.supportedHandleTypes = [NSSet setWithArray:@[@(CXHandleTypeGeneric)]];
    configuration.supportsVideo = true;
    
    self.providerConfiguration = configuration;
}

+ (BOOL)isProviderConfigured {
    return self.providerConfiguration != nil;
}

+ (void)addListener:(nonnull id<JMCallKitListener>)listener {
    [self.emitter addListener:listener];
}

+ (void)removeListener:(nonnull id<JMCallKitListener>)listener {
    [self.emitter removeListener:listener];
}

+ (BOOL)hasActiveCallForUUID:(nonnull NSString *)callUUID {
    CXCall *activeCallForUUID = [[self.callController calls] filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(CXCall *evaluatedObject, NSDictionary<NSString *,id> *bindings) {
        return [evaluatedObject.UUID.UUIDString isEqualToString:callUUID];
    }]].firstObject;
    
    if (!activeCallForUUID) {
        return false;
    }
    return true;
}

+ (void)reportNewIncomingCallWithUUID:(nonnull NSUUID *)uuid
                               handle:(nullable NSString*)handle
                          displayName:(nullable NSString*)displayName
                             hasVideo:(BOOL)hasVideo
                           completion:(nonnull void (^)(NSError *_Nullable))completion {
    if (!self.enabled) {
        return;
    }
    
    CXCallUpdate *callUpdate = [self makeCXUpdateWithHandle:handle displayName:displayName hasVideo:hasVideo];
    [self.provider reportNewIncomingCallWithUUID:uuid update:callUpdate completion:completion];
}

+ (void)reportCallUpdateWith:(nonnull NSUUID *)uuid
                      handle:(nullable NSString *)handle
                 displayName:(nullable NSString *)displayName
                    hasVideo:(BOOL)hasVideo {
    if (!self.enabled) {
        return;
    }
    
    CXCallUpdate *callUpdate = [self makeCXUpdateWithHandle:handle displayName:displayName hasVideo:hasVideo];
    [self.provider reportCallWithUUID:uuid updated:callUpdate];
}

+ (void)reportCallWith:(nonnull NSUUID *)uuid
               endedAt:(nullable NSDate *)dateEnded
                reason:(CXCallEndedReason)endedReason {
    [self.provider reportCallWithUUID:uuid endedAtDate:dateEnded reason:endedReason];
}

+ (void)reportOutgoingCallWith:(nonnull NSUUID *)uuid startedConnectingAt:(nullable NSDate *)dateStartedConnecting {
    [self.provider reportOutgoingCallWithUUID:uuid startedConnectingAtDate:dateStartedConnecting];
}

+ (void)reportOutgoingCallWith:(nonnull NSUUID *)uuid connectedAt:(nullable NSDate *)dateConnected {
    [self.provider reportOutgoingCallWithUUID:uuid connectedAtDate:dateConnected];
}

+ (void)request:(nonnull CXTransaction *)transaction completion:(nonnull void (^)(NSError *_Nullable))completion {
    if (!self.enabled) {
        return;
    }
    
    // XXX keep track of muted actions to avoid "ping-pong"ing. See
    // JMCallKitEmitter for details on the CXSetMutedCallAction handling.
    for (CXAction *action in transaction.actions) {
        if ([action isKindOfClass:[CXSetMutedCallAction class]]) {
            [self.emitter addMuteAction:action.UUID];
        }
    }
    
    [self.callController requestTransaction:transaction completion:completion];
}

@end

@implementation JMCallKitProxy (Helpers)

+ (CXCallUpdate *)makeCXUpdateWithHandle:(nullable NSString *)handle displayName:(nullable NSString *)displayName hasVideo:(BOOL)hasVideo {
    CXCallUpdate *update = [[CXCallUpdate alloc] init];
    update.supportsDTMF = false;
    update.supportsHolding = false;
    update.supportsGrouping = false;
    update.supportsUngrouping = false;
    update.hasVideo = hasVideo;
    update.localizedCallerName = displayName;
    
    if (handle) {
        update.remoteHandle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    }
    
    return update;
}

@end
