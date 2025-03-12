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

#import <UIKit/UIKit.h>

#import "ExternalAPI.h"
#import "JitsiMeet+Private.h"
#import "JitsiMeetConferenceOptions+Private.h"
#import "JitsiMeetView+Private.h"
#import "ReactUtils.h"
#import "RNRootView.h"


#pragma mark UIColor helpers

@interface UIColor (Hex)

+ (UIColor *)colorWithHex:(uint32_t)hex;
+ (UIColor *)colorWithHex:(uint32_t)hex alpha:(CGFloat)alpha;

@end

@implementation UIColor (Hex)

+ (UIColor *)colorWithHex:(uint32_t)hex {
    return [self colorWithHex:hex alpha:1.0];
}

+ (UIColor *)colorWithHex:(uint32_t)hex alpha:(CGFloat)alpha {
    CGFloat red   = ((hex >> 16) & 0xFF) / 255.0;
    CGFloat green = ((hex >> 8) & 0xFF) / 255.0;
    CGFloat blue  = (hex & 0xFF) / 255.0;

    return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}

@end

#pragma mark UIColor helpers end

/**
 * Backwards compatibility: turn the boolean prop into a feature flag.
 */
static NSString *const PiPEnabledFeatureFlag = @"pip.enabled";

/**
 * Forward declarations.
 */
static NSString *recordingModeToString(RecordingMode mode);


@implementation JitsiMeetView {
    /**
     * React Native view where the entire content will be rendered.
     */
    RNRootView *rootView;
}

#pragma mark Initializers

- (instancetype)initWithCoder:(NSCoder *)coder {
    self = [super initWithCoder:coder];
    if (self) {
        [self doInitialize];
    }

    return self;
}

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self doInitialize];
    }

    return self;
}

/**
 * Internal initialization:
 *
 * - sets the background color
 * - registers necessary observers
 */
- (void)doInitialize {
    // Set a background color which matches the one used in JS.
    self.backgroundColor = [UIColor colorWithHex:0x040404 alpha:1];
    
    [self registerObservers];
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
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

- (void)toggleScreenShare:(BOOL)enabled {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI toggleScreenShare:enabled];
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

- (void)setVideoMuted:(BOOL)muted {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendSetVideoMuted:muted];
}

- (void)setClosedCaptionsEnabled:(BOOL)enabled {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendSetClosedCaptionsEnabled:enabled];
}

- (void)toggleCamera {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI toggleCamera];
}

- (void)showNotification:(NSString *)appearance :(NSString *)description :(NSString *)timeout :(NSString *)title :(NSString *)uid {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI showNotification:appearance :description :timeout :title :uid];
}

-(void)hideNotification:(NSString *)uid {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI hideNotification:uid];
}

- (void)startRecording:(RecordingMode)mode :(NSString * _Nullable)dropboxToken :(BOOL)shouldShare :(NSString * _Nullable)rtmpStreamKey :(NSString * _Nullable)rtmpBroadcastID :(NSString * _Nullable)youtubeStreamKey :(NSString * _Nullable)youtubeBroadcastID :(NSDictionary * _Nullable)extraMetadata :(BOOL)transcription {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI startRecording:recordingModeToString(mode) :dropboxToken :shouldShare :rtmpStreamKey :rtmpBroadcastID :youtubeStreamKey :youtubeBroadcastID :extraMetadata :transcription];
}

- (void)stopRecording:(RecordingMode)mode :(BOOL)transcription {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI stopRecording:recordingModeToString(mode) :transcription];
}

- (void)overwriteConfig:(NSDictionary * _Nonnull)config {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI overwriteConfig:config];
}

- (void)sendCameraFacingModeMessage:(NSString * _Nonnull)to :(NSString * _Nullable)facingMode {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendCameraFacingModeMessage:to :facingMode];
}

#pragma mark Private methods

- (void)registerObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleUpdateViewPropsNotification:) name:updateViewPropsNotificationName object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleSendEventNotification:) name:sendEventNotificationName object:nil];
 }

- (void)handleUpdateViewPropsNotification:(NSNotification *)notification {
    NSDictionary *props = [notification.userInfo objectForKey:@"props"];
    [self setProps:props];
}

- (void)handleSendEventNotification:(NSNotification *)notification {
    NSString *eventName = notification.userInfo[@"name"];
    NSString *eventData = notification.userInfo[@"data"];

    SEL sel = NSSelectorFromString([self methodNameFromEventName:eventName]);
    if (sel && [self.delegate respondsToSelector:sel]) {
        [self.delegate performSelector:sel withObject:eventData];
    }
}

/**
  * Converts a specific event name i.e. redux action type description to a
  * method name.
  *
  * @param eventName The event name to convert to a method name.
  * @return A method name constructed from the specified `eventName`.
  */
 - (NSString *)methodNameFromEventName:(NSString *)eventName {
    NSMutableString *methodName
        = [NSMutableString stringWithCapacity:eventName.length];

    for (NSString *c in [eventName componentsSeparatedByString:@"_"]) {
        if (c.length) {
            [methodName appendString:
                methodName.length ? c.capitalizedString : c.lowercaseString];
        }
    }
    [methodName appendString:@":"];

    return methodName;
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
    if (featureFlags[PiPEnabledFeatureFlag] == nil) {
        featureFlags[PiPEnabledFeatureFlag]
            = [NSNumber numberWithBool:
               self.delegate && [self.delegate respondsToSelector:@selector(enterPictureInPicture:)]];
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

@end

static NSString *recordingModeToString(RecordingMode mode) {
    switch (mode) {
        case RecordingModeFile:
            return @"file";
        case RecordingModeStream:
            return @"stream";
        default:
            return nil;
    }
}
