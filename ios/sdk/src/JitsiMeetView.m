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

#import <React/RCTRootView.h>

#import "JitsiMeet+Private.h"
#import "JitsiMeetView+Private.h"


@implementation JitsiMeetView {
    /**
     * The unique identifier of this `JitsiMeetView` within the process for the
     * purposes of `ExternalAPI`. The name scope was inspired by postis which we
     * use on Web for the similar purposes of the iframe-based external API.
     */
    NSString *externalAPIScope;

    RCTRootView *rootView;

    NSNumber *_pictureInPictureEnabled;
}

@dynamic pictureInPictureEnabled;

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

/**
 * Loads a specific URL which may identify a conference to join. The URL is
 * specified in the form of an `NSDictionary` of properties which (1)
 * internally are sufficient to construct a URL `NSString` while (2) abstracting
 * the specifics of constructing the URL away from API clients/consumers. If the
 * specified URL is `nil` and the Welcome page is enabled, the Welcome page is
 * displayed instead.
 *
 * @param urlObject The URL to load which may identify a conference to join.
 */
- (void)loadURL:(NSDictionary *_Nullable)urlObject {
    NSMutableDictionary *props = [[NSMutableDictionary alloc] init];

    if (self.defaultURL) {
        props[@"defaultURL"] = [self.defaultURL absoluteString];
    }

    props[@"colorScheme"] = self.colorScheme;
    props[@"externalAPIScope"] = externalAPIScope;
    props[@"pictureInPictureEnabled"] = @(self.pictureInPictureEnabled);
    props[@"welcomePageEnabled"] = @(self.welcomePageEnabled);

    // XXX If urlObject is nil, then it must appear as undefined in the
    // JavaScript source code so that we check the launchOptions there.
    if (urlObject) {
        props[@"url"] = urlObject;
    }

    // XXX The method loadURL: is supposed to be imperative i.e. a second
    // invocation with one and the same URL is expected to join the respective
    // conference again if the first invocation was followed by leaving the
    // conference. However, React and, respectively,
    // appProperties/initialProperties are declarative expressions i.e. one and
    // the same URL will not trigger an automatic re-render in the JavaScript
    // source code. The workaround implemented bellow introduces imperativeness
    // in React Component props by defining a unique value per loadURL:
    // invocation.
    props[@"timestamp"] = @(mach_absolute_time());

    if (rootView) {
        // Update props with the new URL.
        rootView.appProperties = props;
    } else {
        RCTBridge *bridge = [[JitsiMeet sharedInstance] getReactBridge];
        rootView
            = [[RCTRootView alloc] initWithBridge:bridge
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

#pragma pictureInPictureEnabled getter / setter

- (void) setPictureInPictureEnabled:(BOOL)pictureInPictureEnabled {
    _pictureInPictureEnabled
        = [NSNumber numberWithBool:pictureInPictureEnabled];
}

- (BOOL) pictureInPictureEnabled {
    if (_pictureInPictureEnabled) {
        return [_pictureInPictureEnabled boolValue];
    }

    // The SDK/JitsiMeetView client/consumer did not explicitly enable/disable
    // Picture-in-Picture. However, we may automatically deduce their
    // intentions: we need the support of the client in order to implement
    // Picture-in-Picture on iOS (in contrast to Android) so if the client
    // appears to have provided the support then we can assume that they did it
    // with the intention to have Picture-in-Picture enabled.
    return self.delegate
        && [self.delegate respondsToSelector:@selector(enterPictureInPicture:)];
}

#pragma mark Private methods

+ (BOOL)loadURLInViews:(NSDictionary *)urlObject {
    BOOL handled = NO;

    if (views) {
        for (NSString *externalAPIScope in views) {
            JitsiMeetView *view
                = [self viewForExternalAPIScope:externalAPIScope];

            if (view) {
                [view loadURL:urlObject];
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
