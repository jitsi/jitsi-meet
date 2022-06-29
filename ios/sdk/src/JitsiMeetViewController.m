/*
 * Copyright @ 2022-present 8x8, Inc.
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

#import "JitsiMeetViewController.h"
#import "JitsiMeet+Private.h"
#import "JitsiMeetConferenceOptions+Private.h"
#import "JitsiMeetRenderingView.h"
#import "JitsiMeetView+Private.h"

@interface JitsiMeetViewController ()

@property (strong, nonatomic) JitsiMeetRenderingView *view;

@end

@implementation JitsiMeetViewController

@dynamic view;

- (instancetype)init {
    self = [super init];
    if (self) {
        [self registerObservers];
    }
    
    return self;
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)loadView {
    [super loadView];
    
    self.view = [[JitsiMeetRenderingView alloc] init];
    self.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
}

- (void)viewDidLoad {
    [super viewDidLoad];

    // Set a background color which is in accord with the JavaScript and Android
    // parts of the application and causes less perceived visual flicker than
    // the default background color.
    self.view.backgroundColor = [UIColor colorWithRed:.07f green:.07f blue:.07f alpha:1];
}

- (void)join:(JitsiMeetConferenceOptions *)options withPiP:(BOOL)enablePiP {
    self.view.isPiPEnabled = enablePiP;
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

#pragma mark Private

- (void)registerObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleUpdateViewPropsNotification:) name:updateViewPropsNotificationName object:nil];
}

- (void)handleUpdateViewPropsNotification:(NSNotification *)notification {
    NSDictionary *props = [notification.userInfo objectForKey:@"props"];
    [self.view setProps:props];
}

@end
