/*
 * Copyright @ 2022-present 8x8, Inc.
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
#include <mach/mach_time.h>

#import "JitsiMeetRenderingView.h"
#import "ReactUtils.h"
#import "RNRootView.h"
#import "JitsiMeet+Private.h"

/**
 * Backwards compatibility: turn the boolean prop into a feature flag.
 */
static NSString *const PiPEnabledFeatureFlag = @"pip.enabled";

@interface JitsiMeetRenderingView ()
@end

@implementation JitsiMeetRenderingView {
    /**
     * React Native view where the entire content will be rendered.
     */
    RNRootView *rootView;
}

/**
 * Passes the given props to the React Native application. The props which we pass
 * are a combination of 3 different sources:
 *
 * - JitsiMeet.defaultConferenceOptions
 * - This function's parameters
 * - Some extras which are added by this function
 */
- (void)setProps:(NSDictionary *_Nonnull)newProps {
    NSMutableDictionary *props = mergeProps([[JitsiMeet sharedInstance] getDefaultProps], newProps);

    // Set the PiP flag if it wasn't manually set.
    NSMutableDictionary *featureFlags = props[@"flags"];
    // TODO: temporary implementation
    if (featureFlags[PiPEnabledFeatureFlag] == nil) {
        featureFlags[PiPEnabledFeatureFlag] = @(self.isPiPEnabled);
    }

    // This method is supposed to be imperative i.e. a second
    // invocation with one and the same URL is expected to join the respective
    // conference again if the first invocation was followed by leaving the
    // conference. However, React and, respectively,
    // appProperties/initialProperties are declarative expressions i.e. one and
    // the same URL will not trigger an automatic re-render in the JavaScript
    // source code. The workaround implemented below introduces imperativeness
    // in React Component props by defining a unique value per invocation.
    props[@"timestamp"] = @(mach_absolute_time());

    if (rootView) {
        // Update props with the new URL.
        rootView.appProperties = props;
    } else {
        RCTBridge *bridge = [[JitsiMeet sharedInstance] getReactBridge];
        rootView = [[RNRootView alloc] initWithBridge:bridge
                                           moduleName:@"App"
                                    initialProperties:props];
        rootView.backgroundColor = self.backgroundColor;

        // Add rootView as a subview which completely covers this one.
        [rootView setFrame:[self bounds]];
        rootView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        [self addSubview:rootView];
    }
}

@end
