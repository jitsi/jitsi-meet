/* Copyright @ 2021-present 8x8, Inc.
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

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString * const sendEventNotificationName = @"org.jitsi.meet.SendEvent";

typedef NS_ENUM(NSInteger, RecordingMode) {
    RecordingModeFile,
    RecordingModeStream
};

@interface ExternalAPI : RCTEventEmitter<RCTBridgeModule>

- (void)sendHangUp;
- (void)sendSetAudioMuted:(BOOL)muted;
- (void)sendEndpointTextMessage:(NSString*)message :(NSString*)to;
- (void)toggleScreenShare:(BOOL)enabled;
- (void)retrieveParticipantsInfo:(void (^)(NSArray*))completion;
- (void)openChat:(NSString*)to;
- (void)closeChat;
- (void)sendChatMessage:(NSString*)message :(NSString*)to;
- (void)sendSetVideoMuted:(BOOL)muted;
- (void)sendSetClosedCaptionsEnabled:(BOOL)enabled;
- (void)toggleCamera;
- (void)showNotification:(NSString*)appearance :(NSString*)description :(NSString*)timeout :(NSString*)title :(NSString*)uid;
- (void)hideNotification:(NSString*)uid;
- (void)startRecording:(RecordingMode)mode :(NSString*)dropboxToken :(BOOL)shouldShare :(NSString*)rtmpStreamKey :(NSString*)rtmpBroadcastID :(NSString*)youtubeStreamKey :(NSString*)youtubeBroadcastID :(NSDictionary*)extraMetadata :(BOOL)transcription;
- (void)stopRecording:(RecordingMode)mode :(BOOL)transcription;

@end
