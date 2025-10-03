/*
 * Copyright @ 2024-present 8x8, Inc.
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
#import <React-RCTAppDelegate/RCTAppDelegate.h>

/**
 * Wrapper around RCTAppDelegate for new architecture support.
 * This allows us to configure the new architecture without requiring
 * the app to inherit from RCTAppDelegate.
 * 
 * Similar to RCTBridgeWrapper, this provides new architecture
 * configuration in a modular way.
 */
@interface RCTAppDelegateWrapper : NSObject

@property (nonatomic, readonly, strong) RCTAppDelegate *appDelegate;

- (instancetype)init;
- (void)configureNewArchitecture;

@end

