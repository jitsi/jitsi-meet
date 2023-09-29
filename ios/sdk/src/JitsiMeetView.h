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

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "JitsiMeetConferenceOptions.h"
#import "JitsiMeetViewDelegate.h"

@interface JitsiMeetView : UIView

@property (nonatomic, nullable, weak) id<JitsiMeetViewDelegate> delegate;

/**
 * Joins the conference specified by the given options. The gievn options will
 * be merged with the defaultConferenceOptions (if set) in JitsiMeet. If there
 * is an already active conference it will be automatically left prior to
 * joining the new one.
 */
- (void)join:(JitsiMeetConferenceOptions *_Nullable)options;
/**
 * Leaves the currently active conference.
 */
- (void)leave;
- (void)hangUp;
- (void)setAudioMuted:(BOOL)muted;
- (void)sendEndpointTextMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to;
- (void)toggleScreenShare:(BOOL)enabled;
- (void)retrieveParticipantsInfo:(void (^ _Nonnull)(NSArray * _Nullable))completionHandler;
- (void)openChat:(NSString * _Nullable)to;
- (void)closeChat;
- (void)sendChatMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to;
- (void)setVideoMuted:(BOOL)muted;
- (void)setClosedCaptionsEnabled:(BOOL)enabled;
- (void)toggleCamera;

@end
