/*
 * Copyright @ 2017-present 8x8, Inc.
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

@import CoreSpotlight;
@import MobileCoreServices;
@import Intents;  // Needed for NSUserActivity suggestedInvocationPhrase

@import JitsiMeetSDK;

#import "Types.h"
#import "RoutesHandler.h"
#import "ViewController.h"
#import "jitsi_meet-Swift.h"

@interface ViewController() <RouteObserving>

@property (nonatomic, nonnull, copy) void (^didRouteCallback)(NSString *);
@property (nonatomic, assign) BOOL audioMuted;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    JitsiMeetView *view = (JitsiMeetView *) self.view;
    view.delegate = self;

    [view join:[[JitsiMeet sharedInstance] getInitialConferenceOptions]];

    [self registerRouteObserver];
}

// JitsiMeetViewDelegate

- (void)_onJitsiMeetViewDelegateEvent:(NSString *)name
                             withData:(NSDictionary *)data {
    NSLog(
        @"[%s:%d] JitsiMeetViewDelegate %@ %@",
        __FILE__, __LINE__, name, data);

#if DEBUG
    NSAssert(
        [NSThread isMainThread],
        @"JitsiMeetViewDelegate %@ method invoked on a non-main thread",
        name);
#endif
}

- (void)conferenceJoined:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_JOINED" withData:data];
    
    self.audioMuted = [[data objectForKey:@"isAudioMuted"] boolValue];
    
    [self refreshWidgetState:self.audioMuted];

    // Register a NSUserActivity for this conference so it can be invoked as a
    // Siri shortcut.
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

- (void)conferenceTerminated:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_TERMINATED" withData:data];
    
    NSURL *sharedContainer = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:@"group.org.jitsi.meet.appgroup"];
    NSURL *widgetStateFileURL = [sharedContainer URLByAppendingPathComponent:@"widgetState"];
    [[NSFileManager defaultManager] removeItemAtURL:widgetStateFileURL error:nil];
    
    [WidgetKitHelper reloadAllWidgets];
}

- (void)conferenceWillJoin:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_WILL_JOIN" withData:data];
}

#if 0
- (void)enterPictureInPicture:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"ENTER_PICTURE_IN_PICTURE" withData:data];
}
#endif

- (void)readyToClose:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"READY_TO_CLOSE" withData:data];
}

- (void)participantJoined:(NSDictionary *)data {
  NSLog(@"%@%@", @"Participant joined: ", data[@"participantId"]);
}

- (void)participantLeft:(NSDictionary *)data {
  NSLog(@"%@%@", @"Participant left: ", data[@"participantId"]);
}

- (void)audioMutedChanged:(NSDictionary *)data {
    NSLog(@"%@%@", @"Audio muted changed: ", data[@"muted"]);
//    CFNotificationCenterRef notificationCenter = CFNotificationCenterGetDarwinNotifyCenter();
//    CFNotificationCenterPostNotification(notificationCenter,
//                                         (__bridge CFStringRef)@"iOS_MeetingMutedChanged",
//                                         NULL,
//                                         NULL,
//                                         true);
    
    self.audioMuted = [[data objectForKey:@"muted"] boolValue];
    [self refreshWidgetState:self.audioMuted];
}

- (void)endpointTextMessageReceived:(NSDictionary *)data {
  NSLog(@"%@%@", @"Endpoint text message received: ", data);
}

- (void)screenShareToggled:(NSDictionary *)data {
  NSLog(@"%@%@", @"Screen share toggled: ", data);
}

- (void)chatMessageReceived:(NSDictionary *)data {
    NSLog(@"%@%@", @"Chat message received: ", data);
}

- (void)chatToggled:(NSDictionary *)data {
  NSLog(@"%@%@", @"Chat toggled: ", data);
}

- (void)videoMutedChanged:(NSDictionary *)data {
  NSLog(@"%@%@", @"Video muted changed: ", data[@"muted"]);
}

#pragma mark - Helpers

- (void)registerRouteObserver {
    __weak typeof(self) weakSelf = self;
    __weak JitsiMeetView *view = (JitsiMeetView *)self.view;
    self.didRouteCallback = ^(NSString *route) {
        if ([route isEqual:@"meet/toggleAudioMute"]) {
            weakSelf.audioMuted = !weakSelf.audioMuted;
            [view setAudioMuted:weakSelf.audioMuted];
        } else if ([route isEqualToString:@"meet/leaveMeeting"]) {
            [weakSelf terminate];
        }
    };
    
    [[RoutesHandler sharedInstance] registerObserver:self forRoute:@"meet/toggleAudioMute"];
    [[RoutesHandler sharedInstance] registerObserver:self forRoute:@"meet/leaveMeeting"];
}

- (void)terminate {
    JitsiMeetView *view = (JitsiMeetView *) self.view;
    [view leave];
}

- (void)refreshWidgetState:(BOOL)audioMuted {
//    let sharedContainer = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Constants.appGroupIdentifier)
//    return sharedContainer?.appendingPathComponent("rtc_SSFD").path ?? ""
    
    NSURL *sharedContainer = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:@"group.org.jitsi.meet.appgroup"];
    NSURL *widgetStateFileURL = [sharedContainer URLByAppendingPathComponent:@"widgetState"];
    
    NSDictionary *meetingState = @{@"audioMuted": @(audioMuted)};
    if (![meetingState writeToURL:widgetStateFileURL atomically:true]) {
        NSLog(@"error saving state file");
    }
    
    [WidgetKitHelper reloadAllWidgets];
}

@end
