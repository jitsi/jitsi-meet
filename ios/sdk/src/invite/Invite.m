/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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

#import "Invite+Private.h"
#import "InviteController+Private.h"
#import "JitsiMeetView+Private.h"

// The events emitted/supported by the Invite react-native module:
//
// XXX The event names are ridiculous on purpose. Even though iOS makes it look
// like it emits within the bounderies of a react-native module ony, it actually
// also emits through DeviceEventEmitter. (Of course, Android emits only through
// DeviceEventEmitter.)
static NSString * const InviteEmitterEvent
    = @"org.jitsi.meet:features/invite#invite";
static NSString * const PerformQueryEmitterEvent
    = @"org.jitsi.meet:features/invite#performQuery";

@implementation Invite

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[
        InviteEmitterEvent,
        PerformQueryEmitterEvent
    ];
}

/**
 * Make sure all methods in this module are called in the main (i.e. UI) thread.
 */
- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

/**
 * Initiates the process to add people. This involves calling a delegate method
 * in the JMInviteControllerDelegate so the native host application can start
 * the query process.
 *
 * @param externalAPIScope - Scope identifying the JitsiMeetView where the
 * calling JS code is being executed.
 */
RCT_EXPORT_METHOD(beginAddPeople:(NSString *)externalAPIScope) {
    JitsiMeetView *view
        = [JitsiMeetView viewForExternalAPIScope:externalAPIScope];
    JMInviteController *inviteController = view.inviteController;
    [inviteController beginAddPeople];
}

/**
 * Indicates the the invite process has settled / finished.
 *
 * @param externalAPIScope - Scope identifying the JitsiMeetView where the
 * calling JS code is being executed.
 * @param addPeopleControllerScope - Scope identifying the JMAddPeopleController
 * wich was settled.
 * @param failedInvitees - Array with the invitees which were not invited due
 * to a failure.
 */
RCT_EXPORT_METHOD(inviteSettled:(NSString *)externalAPIScope
       addPeopleControllerScope:(NSString *)addPeopleControllerScope
                 failedInvitees:(NSArray *)failedInvitees) {
    JitsiMeetView *view
        = [JitsiMeetView viewForExternalAPIScope:externalAPIScope];
    JMInviteController *inviteController = view.inviteController;
    [inviteController inviteSettled:addPeopleControllerScope
                     failedInvitees:failedInvitees];
}

/**
 * Process results received for the given query. This involves calling a
 * delegate method in JMAddPeopleControllerDelegate so the native host
 * application is made aware of the query results.
 *
 * @param externalAPIScope - Scope identifying the JitsiMeetView where the
 * calling JS code is being executed.
 * @param addPeopleControllerScope - Scope identifying the JMAddPeopleController
 * for which the results were received.
 * @param query - The actual query for which the results were received.
 * @param results - The query results.
 */
RCT_EXPORT_METHOD(receivedResults:(NSString *)externalAPIScope
         addPeopleControllerScope:(NSString *)addPeopleControllerScope
                            query:(NSString *)query
                          results:(NSArray *)results) {
    JitsiMeetView *view
        = [JitsiMeetView viewForExternalAPIScope:externalAPIScope];
    JMInviteController *inviteController = view.inviteController;
    [inviteController receivedResults:addPeopleControllerScope
                                query:query
                              results:results];
}

- (void)            invite:(NSArray<NSDictionary *> * _Nonnull)invitees
          externalAPIScope:(NSString * _Nonnull)externalAPIScope
  addPeopleControllerScope:(NSString * _Nonnull) addPeopleControllerScope {
    [self sendEventWithName:InviteEmitterEvent
                       body:@{ @"addPeopleControllerScope": addPeopleControllerScope,
                               @"externalAPIScope": externalAPIScope,
                               @"invitees": invitees }];
}

- (void)      performQuery:(NSString * _Nonnull)query
          externalAPIScope:(NSString * _Nonnull)externalAPIScope
  addPeopleControllerScope:(NSString * _Nonnull) addPeopleControllerScope {
    [self sendEventWithName:PerformQueryEmitterEvent
                       body:@{ @"addPeopleControllerScope": addPeopleControllerScope,
                               @"externalAPIScope": externalAPIScope,
                               @"query": query }];
}

@end
