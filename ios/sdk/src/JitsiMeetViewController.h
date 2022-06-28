//
//  JitsiMeetViewController.h
//  JitsiMeetSDK
//
//  Created by Alex Bumbu on 20.06.2022.
//  Copyright © 2022 Jitsi. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "JitsiMeetConferenceOptions.h"

NS_ASSUME_NONNULL_BEGIN

@interface JitsiMeetViewController : UIViewController

- (instancetype)initWithPiPEnabled:(BOOL)pipEnabled;

- (void)join:(JitsiMeetConferenceOptions *)options;
- (void)leave;
- (void)hangUp;
- (void)setAudioMuted:(BOOL)muted;
- (void)sendEndpointTextMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to;
- (void)toggleScreenShare:(BOOL)enabled;
- (void)retrieveParticipantsInfo:(void (^ _Nonnull)(NSArray * _Nullable))completionHandler;
- (void)openChat:(NSString*)to;
- (void)closeChat;
- (void)sendChatMessage:(NSString * _Nonnull)message :(NSString * _Nullable)to;
- (void)setVideoMuted:(BOOL)muted;

@end

NS_ASSUME_NONNULL_END
