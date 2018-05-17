/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

#import <assert.h>

#import "ViewController.h"

/**
 * The query to perform through JMAddPeopleController when the InviteButton is
 * tapped in order to exercise the public API of the feature invite. If nil, the
 * InviteButton will not be rendered.
 */
static NSString * const ADD_PEOPLE_CONTROLLER_QUERY = nil;

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    JitsiMeetView *view = (JitsiMeetView *) self.view;

#ifdef DEBUG

    view.delegate = self;

    // inviteController
    JMInviteController *inviteController = view.inviteController;
    inviteController.delegate = self;
    inviteController.addPeopleEnabled
        = inviteController.dialOutEnabled
        = ADD_PEOPLE_CONTROLLER_QUERY != nil;

#endif // #ifdef DEBUG

    // As this is the Jitsi Meet app (i.e. not the Jitsi Meet SDK), we do want
    // the Welcome page to be enabled. It defaults to disabled in the SDK at the
    // time of this writing but it is clearer to be explicit about what we want
    // anyway.
    view.welcomePageEnabled = YES;

    [view loadURL:nil];
}

#if DEBUG

// JitsiMeetViewDelegate

void _onJitsiMeetViewDelegateEvent(NSString *name, NSDictionary *data) {
    NSLog(
        @"[%s:%d] JitsiMeetViewDelegate %@ %@",
        __FILE__, __LINE__, name, data);

    assert([NSThread isMainThread]
        && "Delegate method called in a non-main thread");
}

- (void)conferenceFailed:(NSDictionary *)data {
    _onJitsiMeetViewDelegateEvent(@"CONFERENCE_FAILED", data);
}

- (void)conferenceJoined:(NSDictionary *)data {
    _onJitsiMeetViewDelegateEvent(@"CONFERENCE_JOINED", data);
}

- (void)conferenceLeft:(NSDictionary *)data {
    _onJitsiMeetViewDelegateEvent(@"CONFERENCE_LEFT", data);
}

- (void)conferenceWillJoin:(NSDictionary *)data {
    _onJitsiMeetViewDelegateEvent(@"CONFERENCE_WILL_JOIN", data);
}

- (void)conferenceWillLeave:(NSDictionary *)data {
    _onJitsiMeetViewDelegateEvent(@"CONFERENCE_WILL_LEAVE", data);
}

- (void)loadConfigError:(NSDictionary *)data {
    _onJitsiMeetViewDelegateEvent(@"LOAD_CONFIG_ERROR", data);
}

// JMInviteControllerDelegate

- (void)beginAddPeople:(JMAddPeopleController *)addPeopleController {
    NSLog(
        @"[%s:%d] JMInviteControllerDelegate %s",
        __FILE__, __LINE__, __FUNCTION__);

    assert([NSThread isMainThread]
        && "Delegate method called in a non-main thread");

    NSString *query = ADD_PEOPLE_CONTROLLER_QUERY;
    JitsiMeetView *view = (JitsiMeetView *) self.view;
    JMInviteController *inviteController = view.inviteController;

    if (query
            && (inviteController.addPeopleEnabled
                || inviteController.dialOutEnabled)) {
        addPeopleController.delegate = self;
        [addPeopleController performQuery:query];
    } else {
        // XXX Explicitly invoke endAddPeople on addPeopleController; otherwise,
        // it is going to be memory-leaked in the associated JMInviteController
        // and no subsequent InviteButton clicks/taps will be delivered.
        [addPeopleController endAddPeople];
    }
}

// JMAddPeopleControllerDelegate

- (void)addPeopleController:(JMAddPeopleController * _Nonnull)controller
          didReceiveResults:(NSArray<NSDictionary *> * _Nonnull)results
                   forQuery:(NSString * _Nonnull)query {
    assert([NSThread isMainThread]
        && "Delegate method called in a non-main thread");

    NSUInteger count = results.count;

    if (count) {
        // Exercise JMAddPeopleController's inviteById: implementation.
        NSMutableArray *ids = [NSMutableArray arrayWithCapacity:count];

        for (NSUInteger i = 0; i < count; ++i) {
            ids[i] = results[i][@"id"];
        }

        [controller inviteById:ids];

        // Exercise JMInviteController's invite:withCompletion: implementation.
        //
        // XXX Technically, only at most one of the two exercises will result in
        // an actual invitation eventually.
        JitsiMeetView *view = (JitsiMeetView *) self.view;
        JMInviteController *inviteController = view.inviteController;

        [inviteController invite:results withCompletion:nil];

        return;
    }

    // XXX Explicitly invoke endAddPeople on addPeopleController; otherwise, it
    // is going to be memory-leaked in the associated JMInviteController and no
    // subsequent InviteButton clicks/taps will be delivered.
    [controller endAddPeople];
}

- (void) inviteSettled:(NSArray<NSDictionary *> * _Nonnull)failedInvitees
  fromSearchController:(JMAddPeopleController * _Nonnull)addPeopleController {
    assert([NSThread isMainThread]
        && "Delegate method called in a non-main thread");

    // XXX Explicitly invoke endAddPeople on addPeopleController; otherwise, it
    // is going to be memory-leaked in the associated JMInviteController and no
    // subsequent InviteButton clicks/taps will be delivered. Technically,
    // endAddPeople will automatically be invoked if there are no
    // failedInviteees i.e. the invite succeeeded for all specified invitees.
    [addPeopleController endAddPeople];
}

#endif // #ifdef DEBUG

@end
