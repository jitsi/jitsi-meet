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

#import <Availability.h>

@import CoreSpotlight;
@import MobileCoreServices;
@import Intents;  // Needed for NSUserActivity suggestedInvocationPhrase

#import "Types.h"
#import "ViewController.h"


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    JitsiMeetView *view = (JitsiMeetView *) self.view;
    view.delegate = self;

    // As this is the Jitsi Meet app (i.e. not the Jitsi Meet SDK), we do want
    // the Welcome page to be enabled. It defaults to disabled in the SDK at the
    // time of this writing but it is clearer to be explicit about what we want
    // anyway.
    view.welcomePageEnabled = YES;

    [view join:[[JitsiMeet sharedInstance] getInitialURL]];
}

// JitsiMeetViewDelegate

- (void)_onJitsiMeetViewDelegateEvent:(NSString *)name
                             withData:(NSDictionary *)data {
#if DEBUG
    NSLog(
        @"[%s:%d] JitsiMeetViewDelegate %@ %@",
        __FILE__, __LINE__, name, data);

    NSAssert(
        [NSThread isMainThread],
        @"JitsiMeetViewDelegate %@ method invoked on a non-main thread",
        name);
#endif
}

- (void)conferenceFailed:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_FAILED" withData:data];
}

- (void)conferenceJoined:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_JOINED" withData:data];

    // Register a NSUserActivity for this conference so it can be invoked as a
    // Siri shortcut. This is only supported in iOS >= 12.
#ifdef __IPHONE_12_0
    if (@available(iOS 12.0, *)) {
      NSUserActivity *userActivity
        = [[NSUserActivity alloc] initWithActivityType:JitsiMeetConferenceActivityType];

      NSString *urlStr = data[@"url"];
      NSURL *url = [NSURL URLWithString:urlStr];
      NSString *conference = [url.pathComponents lastObject];

      userActivity.title = [NSString stringWithFormat:@"Join %@", conference];
      userActivity.suggestedInvocationPhrase = @"Join my Jitsi meeting";
      userActivity.userInfo = @{@"url": urlStr};
      [userActivity setEligibleForSearch:YES];
      [userActivity setEligibleForPrediction:YES];
      [userActivity setPersistentIdentifier:urlStr];

      // Subtitle
      CSSearchableItemAttributeSet *attributes
        = [[CSSearchableItemAttributeSet alloc] initWithItemContentType:(NSString *)kUTTypeItem];
      attributes.contentDescription = urlStr;
      userActivity.contentAttributeSet = attributes;

      self.userActivity = userActivity;
      [userActivity becomeCurrent];
    }
#endif

}

- (void)conferenceLeft:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_LEFT" withData:data];
}

- (void)conferenceWillJoin:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_WILL_JOIN" withData:data];
}

- (void)conferenceWillLeave:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_WILL_LEAVE" withData:data];
}

- (void)loadConfigError:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"LOAD_CONFIG_ERROR" withData:data];
}

@end
