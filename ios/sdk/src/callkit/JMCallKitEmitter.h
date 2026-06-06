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

@interface JMCallKitEmitter : NSObject <CXProviderDelegate>

#pragma mark Add/Remove listeners
- (void)addListener:(id<JMCallKitListener>)listener;
- (void)removeListener:(id<JMCallKitListener>)listener;

#pragma mark Add mute action
- (void)addMuteAction:(NSUUID *)actionUUID;

@end

NS_ASSUME_NONNULL_END
