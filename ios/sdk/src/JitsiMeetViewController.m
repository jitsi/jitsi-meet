//
//  JitsiMeetViewController.m
//  JitsiMeetSDK
//
//  Created by Alex Bumbu on 20.06.2022.
//  Copyright © 2022 Jitsi. All rights reserved.
//

#import "JitsiMeetViewController.h"
#import "JitsiMeet+Private.h"
#import "JitsiMeetConferenceOptions+Private.h"
#import "JitsiMeetRenderingView.h"

@interface JitsiMeetViewController ()

@property (strong, nonatomic) JitsiMeetRenderingView *view;
@property (assign, nonatomic) BOOL isPiPEnabled;

@end

@implementation JitsiMeetViewController

@dynamic view;

- (instancetype)initWithPiPEnabled:(BOOL)pipEnabled {
    self = [super init];
    if (self) {
        self.isPiPEnabled = pipEnabled;
    }
    
    return self;
}

- (void)loadView {
    [super loadView];
    
    self.view = [[JitsiMeetRenderingView alloc] init];
    self.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.view.isPiPEnabled = self.isPiPEnabled;
}

- (void)viewDidLoad {
    [super viewDidLoad];

    // Set a background color which is in accord with the JavaScript and Android
    // parts of the application and causes less perceived visual flicker than
    // the default background color.
    self.view.backgroundColor = [UIColor colorWithRed:.07f green:.07f blue:.07f alpha:1];
}

- (void)join:(JitsiMeetConferenceOptions *)options {
    [self.view setProps:options == nil ? @{} : [options asProps]];
}

- (void)leave {
    [self.view setProps:@{}];
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

@end
