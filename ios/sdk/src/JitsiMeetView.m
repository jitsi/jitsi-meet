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
#import "JitsiMeetView.h"
#import "JitsiMeetViewController.h"
#import "ReactUtils.h"
#import "RNRootView.h"

@interface JitsiMeetView ()

@property (nonatomic, strong) JitsiMeetViewController *jitsiMeetViewController;
@property (nonatomic, strong) UINavigationController *navController;
@property (nonatomic, readonly) BOOL isPiPEnabled;

@end

@implementation JitsiMeetView

@dynamic isPiPEnabled;

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

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

/**
 * Internal initialization:
 *
 * - sets the background color
 * - initializes the external API scope
 */
- (void)initWithXXX {
    self.jitsiMeetViewController = [[JitsiMeetViewController alloc] init];
    self.jitsiMeetViewController.view.frame = [self bounds];
    [self addSubview:self.jitsiMeetViewController.view];
    
    [self registerObservers];
}

#pragma mark API

- (void)join:(JitsiMeetConferenceOptions *)options {
    [self.jitsiMeetViewController join:options withPiP:self.isPiPEnabled];
}

- (void)leave {
    [self.jitsiMeetViewController leave];
}

- (void)hangUp {
    [self.jitsiMeetViewController hangUp];
}

- (void)setAudioMuted:(BOOL)muted {
    [self.jitsiMeetViewController setAudioMuted:muted];
}

- (void)sendEndpointTextMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to {
    [self.jitsiMeetViewController sendEndpointTextMessage:message :to];
}

- (void)toggleScreenShare:(BOOL)enabled {
    [self.jitsiMeetViewController toggleScreenShare:enabled];
}

- (void)retrieveParticipantsInfo:(void (^ _Nonnull)(NSArray * _Nullable))completionHandler {
    [self.jitsiMeetViewController retrieveParticipantsInfo:completionHandler];
}

- (void)openChat:(NSString*)to  {
    [self.jitsiMeetViewController openChat:to];
}

- (void)closeChat  {
    [self.jitsiMeetViewController closeChat];
}

- (void)sendChatMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to {
    [self.jitsiMeetViewController sendChatMessage:message :to];
}

- (void)setVideoMuted:(BOOL)muted {
    [self.jitsiMeetViewController setVideoMuted:muted];
}

- (void)setClosedCaptionsEnabled:(BOOL)enabled {
    ExternalAPI *externalAPI = [[JitsiMeet sharedInstance] getExternalAPI];
    [externalAPI sendSetClosedCaptionsEnabled:enabled];
}

#pragma mark Private

- (BOOL)isPiPEnabled {
    return self.delegate && [self.delegate respondsToSelector:@selector(enterPictureInPicture:)];
}

- (void)registerObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleSendEventNotification:) name:sendEventNotificationName object:nil];
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

@end
