/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
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

#import "ExternalAPI.h"
#import "JitsiMeet+Private.h"
#import "JitsiMeetConferenceOptions+Private.h"
#import "JitsiMeetView+Private.h"
#import "ReactUtils.h"
#import "RNRootView.h"


/**
 * Backwards compatibility: turn the boolean prop into a feature flag.
 */
static NSString *const PiPEnabledFeatureFlag = @"pip.enabled";


@implementation JitsiMeetView {
    /**
     * The unique identifier of this `JitsiMeetView` within the process for the
     * purposes of `ExternalAPI`. The name scope was inspired by postis which we
     * use on Web for the similar purposes of the iframe-based external API.
     */
    NSString *externalAPIScope;

    /**
     * React Native view where the entire content will be rendered.
     */
    RNRootView *rootView;
}

/**
 * The `JitsiMeetView`s associated with their `ExternalAPI` scopes (i.e. unique
 * identifiers within the process).
 */
static NSMapTable<NSString *, JitsiMeetView *> *views;
/**
 * This gets called automagically when the program starts.
 */
__attribute__((constructor))
static void initializeViewsMap() {
    views = [NSMapTable strongToWeakObjectsMapTable];
}

#pragma mark Initializers

- (instancetype)init {
    self = [super init];
    if (self) {
        [self initWithXXX];
    }

    return self;
}

- (instancetype)initWithCoder:(NSCoder *)coder {
    self = [super initWithCoder:coder];
    if (self) {
        [self initWithXXX];
    }

    return self;
}

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self initWithXXX];
    }

    return self;
}

/**
 * Internal initialization:
 *
 * - sets the background color
 * - initializes the external API scope
 */
- (void)initWithXXX {
    // Hook this JitsiMeetView into ExternalAPI.
    externalAPIScope = [NSUUID UUID].UUIDString;
    [views setObject:self forKey:externalAPIScope];

    // Set a background color which is in accord with the JavaScript and Android
    // parts of the application and causes less perceived visual flicker than
    // the default background color.
    self.backgroundColor
        = [UIColor colorWithRed:.07f green:.07f blue:.07f alpha:1];
}

#pragma mark API

- (void)join:(JitsiMeetConferenceOptions *)options {
    [self setProps:options == nil ? @{} : [options asProps]];
}

- (void)leave {
    [self setProps:@{}];
}

- (void)hangUp {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendHangUp];
}

- (void)setAudioMuted:(BOOL)muted {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendSetAudioMuted:muted];
}

- (void)sendEndpointTextMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendEndpointTextMessage:message :to];
}

- (void)toggleScreenShare {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI toggleScreenShare];
}

- (void)retrieveParticipantsInfo:(void (^ _Nonnull)(NSArray * _Nullable))completionHandler {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI retrieveParticipantsInfo:completionHandler];
}

- (void)openChat:(NSString*)to  {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI openChat:to];
}

- (void)closeChat  {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI closeChat];
}

- (void)sendChatMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendChatMessage:message :to];
}

#pragma mark Private methods

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
    if (featureFlags[PiPEnabledFeatureFlag] == nil) {
        featureFlags[PiPEnabledFeatureFlag]
            = [NSNumber numberWithBool:
               self.delegate && [self.delegate respondsToSelector:@selector(enterPictureInPicture:)]];
    }

    props[@"externalAPIScope"] = externalAPIScope;

    // This method is supposed to be imperative i.e. a second
    // invocation with one and the same URL is expected to join the respective
    // conference again if the first invocation was followed by leaving the
    // conference. However, React and, respectively,
    // appProperties/initialProperties are declarative expressions i.e. one and
    // the same URL will not trigger an automatic re-render in the JavaScript
    // source code. The workaround implemented bellow introduces imperativeness
    // in React Component props by defining a unique value per invocation.
    props[@"timestamp"] = @(mach_absolute_time());

    if (rootView) {
        // Update props with the new URL.
        rootView.appProperties = props;
    } else {
        RCTBridge *bridge = [[JitsiMeet sharedInstance] getReactBridge];
        rootView
            = [[RNRootView alloc] initWithBridge:bridge
                                      moduleName:@"App"
                               initialProperties:props];
        rootView.backgroundColor = self.backgroundColor;

        // Add rootView as a subview which completely covers this one.
        [rootView setFrame:[self bounds]];
        rootView.autoresizingMask
            = UIViewAutoresizingFlexibleWidth
                | UIViewAutoresizingFlexibleHeight;
        [self addSubview:rootView];
    }
}

+ (BOOL)setPropsInViews:(NSDictionary *_Nonnull)newProps {
    BOOL handled = NO;

    if (views) {
        for (NSString *externalAPIScope in views) {
            JitsiMeetView *view
                = [self viewForExternalAPIScope:externalAPIScope];

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
