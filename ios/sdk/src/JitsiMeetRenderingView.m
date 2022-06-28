//
//  JitsiMeetRenderingView.m
//  JitsiMeetSDK
//
//  Created by Alex Bumbu on 20.06.2022.
//  Copyright © 2022 Jitsi. All rights reserved.
//

#include <mach/mach_time.h>

#import "JitsiMeetRenderingView.h"
#import "ReactUtils.h"
#import "RNRootView.h"
#import "JitsiMeet+Private.h"

/**
 * Backwards compatibility: turn the boolean prop into a feature flag.
 */
static NSString *const PiPEnabledFeatureFlag = @"pip.enabled";

/**
 * The `JitsiMeetView`s associated with their `ExternalAPI` scopes (i.e. unique
 * identifiers within the process).
 */
static NSMapTable<NSString *, JitsiMeetRenderingView *> *views;

/**
 * This gets called automagically when the program starts.
 */
__attribute__((constructor))
static void initializeViewsMap() {
    views = [NSMapTable strongToWeakObjectsMapTable];
}

@interface JitsiMeetRenderingView ()

/**
 * The unique identifier of this `JitsiMeetView` within the process for the
 * purposes of `ExternalAPI`. The name scope was inspired by postis which we
 * use on Web for the similar purposes of the iframe-based external API.
 */
@property (nonatomic, strong) NSString *externalAPIScope;

@end

@implementation JitsiMeetRenderingView {
    /**
     * React Native view where the entire content will be rendered.
     */
    RNRootView *rootView;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // Hook this JitsiMeetView into ExternalAPI.
        self.externalAPIScope = [NSUUID UUID].UUIDString;
        [views setObject:self forKey:self.externalAPIScope];
    }
    
    return self;
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

    props[@"externalAPIScope"] = self.externalAPIScope;

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

+ (BOOL)setPropsInViews:(NSDictionary *_Nonnull)newProps {
    BOOL handled = NO;

    if (views) {
        for (NSString *externalAPIScope in views) {
            JitsiMeetRenderingView *view = [self viewForExternalAPIScope:externalAPIScope];

            if (view) {
                [view setProps:newProps];
                handled = YES;
            }
        }
    }

    return handled;
}

+ (instancetype)viewForExternalAPIScope:(NSString *)externalAPIScope {
    return [views objectForKey:externalAPIScope];
}

@end
