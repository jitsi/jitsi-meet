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

#import "RCTAppDelegateWrapper.h"
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>

@implementation RCTAppDelegateWrapper {
    RCTBridge *_bridge;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        NSLog(@"🏗️ JitsiMeet: Creating RCTAppDelegateWrapper");
        _appDelegate = [[RCTAppDelegate alloc] init];
        NSLog(@"✅ JitsiMeet: RCTAppDelegate created: %@", _appDelegate);
    }
    return self;
}

- (void)configureNewArchitecture {
    @try {
        NSLog(@"⚙️ JitsiMeet: Configuring new architecture");
        _appDelegate.dependencyProvider = [[RCTAppDependencyProvider alloc] init];
        _appDelegate.initialProps = @{};
        
        // Create bridge with ourselves as delegate
        _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
        NSLog(@"✅ JitsiMeet: New architecture bridge created: %@", _bridge);
    } @catch (NSException *exception) {
        NSLog(@"⚠️ JitsiMeet: Configuration failed: %@", exception.reason);
    }
}

- (RCTBridge *)getBridge {
    NSLog(@"🔍 RCTAppDelegateWrapper: getBridge called");
    NSLog(@"🔍 RCTAppDelegateWrapper: Bridge: %@", _bridge);
    NSLog(@"✅ RCTAppDelegateWrapper: Returning NEW ARCHITECTURE bridge");
    return _bridge;
}

#pragma mark - RCTBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    NSURL *url;
#if DEBUG
    url = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
    NSLog(@"🔍 RCTAppDelegateWrapper bundleURL (DEBUG): %@", url);
#else
    url = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    NSLog(@"🔍 RCTAppDelegateWrapper bundleURL (RELEASE): %@", url);
#endif
    return url;
}

@end

