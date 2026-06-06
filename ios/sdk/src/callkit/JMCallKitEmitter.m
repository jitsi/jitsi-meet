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

#import "JMCallKitEmitter.h"

@interface JMCallKitEmitter()

@property(nonatomic, strong) NSMutableArray<id<JMCallKitListener>> *listeners;
@property(nonatomic, strong) NSMutableSet<NSUUID *> *pendingMuteActions;

@end

@implementation JMCallKitEmitter

- (instancetype)init {
    self = [super init];
    if (self) {
        self.listeners = [[NSMutableArray alloc] init];
        self.pendingMuteActions = [[NSMutableSet alloc] init];
    }
    return self;
}

#pragma mark Add/Remove listeners

- (void)addListener:(id<JMCallKitListener>)listener {
    if (![self.listeners containsObject:listener]) {
        [self.listeners addObject:listener];
    }
}

- (void)removeListener:(id<JMCallKitListener>)listener {
    [self.listeners removeObject:listener];
}

#pragma mark Add mute action

- (void)addMuteAction:(NSUUID *)actionUUID {
    [self.pendingMuteActions addObject:actionUUID];
}

#pragma mark CXProviderDelegate

- (void)providerDidReset:(CXProvider *)provider {
    for (id listener in self.listeners) {
        [listener providerDidReset];
    }
    [self.pendingMuteActions removeAllObjects];
}

- (void)provider:(CXProvider *)provider performAnswerCallAction:(CXAnswerCallAction *)action {
    for (id listener in self.listeners) {
        [listener performAnswerCallWithUUID:action.callUUID];
    }
    [action fulfill];
}

- (void)provider:(CXProvider *)provider performEndCallAction:(CXEndCallAction *)action {
    for (id listener in self.listeners) {
        [listener performEndCallWithUUID:action.callUUID];
    }
    [action fulfill];
}

- (void)provider:(CXProvider *)provider performSetMutedCallAction:(CXSetMutedCallAction *)action {
    NSUUID *uuid = ([self.pendingMuteActions containsObject:action.UUID]) ? action.UUID : nil;
    [self.pendingMuteActions removeObject:action.UUID];
    
    // Avoid mute actions ping-pong: if the mute action was caused by
    // the JS side (we requested a transaction) don't call the delegate
    // method. If it was called by the provider itself (when the user presses
    // the mute button in the CallKit view) then call the delegate method.
    //
    // NOTE: don't try to be clever and remove this. Been there, done that.
    // Won't work.
    if (uuid == nil) {
        for (id listener in self.listeners) {
            [listener performSetMutedCallWithUUID:action.callUUID isMuted:action.isMuted];
        }
    }
    [action fulfill];
}

- (void)provider:(CXProvider *)provider performStartCallAction:(CXStartCallAction *)action {
    for (id listener in self.listeners) {
        [listener performStartCallWithUUID:action.callUUID isVideo:action.isVideo];
    }
    [action fulfill];
}

- (void)provider:(CXProvider *)provider didActivateAudioSession:(AVAudioSession *)audioSession {
    for (id listener in self.listeners) {
        [listener providerDidActivateAudioSessionWithSession:audioSession];
    }
}

- (void)provider:(CXProvider *)provider didDeactivateAudioSession:(AVAudioSession *)audioSession {
    for (id listener in self.listeners) {
        [listener providerDidDeactivateAudioSessionWithSession:audioSession];
    }
}

@end
