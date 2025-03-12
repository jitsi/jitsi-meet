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
#import "ViewController.h"


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    JitsiMeetView *view = (JitsiMeetView *) self.view;
    view.delegate = self;

    [view join:[[JitsiMeet sharedInstance] getInitialConferenceOptions]];
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
}

// - (void)conferenceUniqueIdSet:(NSDictionary *)data {
//     [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_UNIQUE_ID_SET" withData:data];
// }

- (void)conferenceWillJoin:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CONFERENCE_WILL_JOIN" withData:data];
}

- (void)customButtonPressed:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"CUSTOM_BUTTON_PRESSED" withData:data];
    
    NSString *buttonId = data[@"id"];
    JitsiMeetView *view = (JitsiMeetView *)self.view;
    
    if ([buttonId isEqualToString:@"record"]) {
        long timestamp = (long)[[NSDate date] timeIntervalSince1970];
        int random = arc4random_uniform(10000);
        NSString *interactionId = [NSString stringWithFormat:@"interaction_%ld_%d", timestamp, random];
        
        NSDictionary *extraMetadata = @{@"call_id": interactionId};
        
        NSLog(@"Starting recording with metadata: %@", extraMetadata);
        
        // Start recording
        [view startRecording:0  // mode: 0 for file recording
                           :@""  // dropboxToken
                           :NO  // shouldShare
                           :@""  // rtmpStreamKey
                           :@""  // rtmpBroadcastID
                           :@""  // youtubeStreamKey
                           :@""  // youtubeBroadcastID
                           :extraMetadata  // extraMetadata
                           :NO];  // transcription
        
        // Create config for switching to close button
        NSDictionary *closeButton = @{
            @"icon": @"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAO5SURBVHic7ZrvURsxEMWfMvkepwKug7gDnApwB7iDkAogFUAqwB3EVMC5AtwBpgJMBS8fpBubG+lO0snGHt5v5obxv5X2Ie2u9g4QQgghhBBCCCGEEEIIIYQQQgghhBCfE/NRA5McAfjhXo4BjHY+br8OsQKw2Xldu78vxpj14ElmsHdBSY5hhasATGCFGu97XMfaXSt3rY0xy30OWFxQkuewwjXXMbKCXc01gKUxZtPz/WgGC+q27gWAKbYr8NRYuOthqLjZgpKsAFzDCnmKIvrYwAr71xizyjGQLCjJCayQJbfzC2ysa2gnmxC7c9hNciWoAfwxxtS939whWlC3tW8BzBIn1rDE+ySxSZ1sLC4RjvA+CY4BfMswNwfwu2ScBckxyWfGsyY5J3nlnDsKSFYkZ25u6wR/nov54cR8jRTx5pgE7MP5dhUp7utg39x/tE/MOW1cPWlITpwvfaJWQwZ57DC+GGT8SHGrtu7w+zHX8KTDaG5iOhloY205/90K/JRiNpCcpq7SYNlEkp63H4wx0yKz9Y9ZATiDLXcqd/loyq8ae26EkLwD8Mvz0ffoUqpjuxfP4CQvSN4yrSxr8+RsnO9hflVgzPhETFv+tCm2CtwkrweKGOLZ2S6WMOkvq25SDPjKh0WBiY1oV9KhuKc94Q2dty/r3/m++yVgw/ffzWoW7EyqAvAE4GqInURmAEqccnxHZK/NrwMHSuEfwkmmTdMsCZ31m6R1FmFrBOCe5M+i5/EABxGU5BW6u/Rv2PYk61jH3XaewLYQpwg3P8awOyM+7pUkEDOyJ8Nw8qlZsK6lLcZDp5znAXZ9STq+U8aCSYn2KOdjb7GUtuHhIyuW0n/Imfu+G0pKvhIpN1t66zVjjDdLlsDZfoudSwQ+371lZIqguUWzz4mHTFsp+LZk7inP53uSoN4SiYltOtpS6cLz0V469RFjnDOx4O8IE2llJMlNbNzY+c05yUva4v0pEMeY6lQODB8Zye1R9ZI9x1WSd57fB6uQrrJpAeCy9d4lyVdsb6A19266Ghltlod4qsMYsya5hH+7NveYAAC0faCm4bLB+9XX1gCw2qTB7n7oEA7W3T86H9jduc7h4L1UdjeKc8iP/7RxyBdLU1mR3FsfNcKPqZvDUDbsqWV778s7AwvEnZsbltg+oFV/1JNwbWiT4QTbGJpSCr4AmPU9S5DyoMMM26ZEQ/OERxPI18ciXixO5ArhBLuGXRSdFY4QQgghhBBCCCGEEEIIIYQQQgghhPjs/AeC/qR/mZe1AQAAAABJRU5ErkJggg==",
            @"backgroundColor": @"red",
            @"id": @"close"
        };
        
        // Create array with just the close button
        NSArray *customButtonsArray = @[closeButton];
        
        // Create array with recording toolbar buttons
        NSArray *toolbarButtonsArray = @[@"close", @"microphone", @"camera", @"chat", @"hangup"];
        
        // Create config object
        NSDictionary *configObj = @{
            @"customToolbarButtons": customButtonsArray,
            @"toolbarButtons": toolbarButtonsArray
        };
        
        // Update the config
        [view overwriteConfig:configObj];
        
    } else if ([buttonId isEqualToString:@"close"]) {
        // Stop recording
        [view stopRecording:0  // mode: 0 for file recording
                          :NO];  // transcription
        
        // Create config for switching back to record button
        NSDictionary *recordButton = @{
            @"icon": @"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFISURBVHgBxVWBcYMwDJQ7QbuBu4FHcDfoBvEGZQOSicgGdIPQCWADRnClQ76qYFE7Vy5/J3yRXpKlCAFwMEwJKcbo8CCxrJpQBmPMAPcCgz6jtChz1DGifBC3NrhnZ0KPElCsrIh1nUjkS4OfapwosbjM6S+yZ+Ktpmxu5419/R5pZKnraYk/Khu+gYU7ITpwTjojjCMeXzh675ozLKNKuCJvUng98dD+IpWOMwfFqY1btAo3sN3tK39sNurwO/xAv59Yb+mhvJnZljE2FxKtszLBYUgJJnooE7S3b65rhWjzJBOkIH7tgCV/4nGBLS7KJDkZU47pDMuGfMs4perS/zFw4hyvg2VMX9eGszYZpRAT1OSMx64KJh237AQ5vXRjLNhL8fe3I0AJVk4dJ3XCblnXi8t4qAGX3YhEOcw8HGo7H/fR/y98AzFrGjU3gjYAAAAAAElFTkSuQmCC",
            @"id": @"record"
        };
        
        // Create array with just the record button
        NSArray *customButtonsArray = @[recordButton];
        
        // Create array with initial toolbar buttons
        NSArray *toolbarButtonsArray = @[@"record", @"microphone", @"camera", @"chat", @"hangup"];
        
        // Create config object
        NSDictionary *configObj = @{
            @"customToolbarButtons": customButtonsArray,
            @"toolbarButtons": toolbarButtonsArray
        };
        
        // Update the config
        [view overwriteConfig:configObj];
    }
}

#if 0
- (void)enterPictureInPicture:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"ENTER_PICTURE_IN_PICTURE" withData:data];
}
#endif

- (void)readyToClose:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"READY_TO_CLOSE" withData:data];
}

- (void)recordingStatusChanged:(NSDictionary *)data {
    [self _onJitsiMeetViewDelegateEvent:@"RECORDING_STATUS_CHANGED" withData:data];
}

// - (void)transcriptionChunkReceived:(NSDictionary *)data {
//     [self _onJitsiMeetViewDelegateEvent:@"TRANSCRIPTION_CHUNK_RECEIVED" withData:data];
// }

- (void)participantJoined:(NSDictionary *)data {
  NSLog(@"%@%@", @"Participant joined: ", data[@"participantId"]);
}

- (void)participantLeft:(NSDictionary *)data {
  NSLog(@"%@%@", @"Participant left: ", data[@"participantId"]);
}

- (void)audioMutedChanged:(NSDictionary *)data {
  NSLog(@"%@%@", @"Audio muted changed: ", data[@"muted"]);
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

- (void)terminate {
    JitsiMeetView *view = (JitsiMeetView *) self.view;
    [view leave];
}

@end
