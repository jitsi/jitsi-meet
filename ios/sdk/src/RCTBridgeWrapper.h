/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeDelegate.h>

/**
 * A wrapper around the `RCTBridge` which implements the delegate methods
 * that allow us to serve the JS bundle from within the framework's resources
 * directory. This is the recommended way for those cases where the builtin API
 * doesn't cut it, as is the case.
 *
 * In addition, we will create a single bridge and then create all root views
 * off it, thus only loading the JS bundle a single time. This class is not a
 * singleton, however, so it's possible for us to create multiple instances of
 * it, though that's not currently used.
 */
@interface RCTBridgeWrapper : NSObject<RCTBridgeDelegate>

@property (nonatomic, readonly, strong)  RCTBridge *bridge;

@end
