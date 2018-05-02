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
 * Calls the corresponding JitsiMeetView's delegate to request that the native
 * invite search be presented.
 *
 * @param scope
 */
RCT_EXPORT_METHOD(beginAddPeople:(NSString *)externalAPIScope) {
    JitsiMeetView *view = [JitsiMeetView viewForExternalAPIScope:externalAPIScope];
    InviteController *controller = view.inviteController;
    [controller beginAddPeople];
}

RCT_EXPORT_METHOD(inviteSettled:(NSString *)externalAPIScope
       addPeopleControllerScope:(NSString *)addPeopleControllerScope
                 failedInvitees:(NSArray *)failedInvitees) {
    JitsiMeetView *view = [JitsiMeetView viewForExternalAPIScope:externalAPIScope];
    InviteController *controller = view.inviteController;
    [controller inviteSettled:addPeopleControllerScope failedInvitees:failedInvitees];
}

RCT_EXPORT_METHOD(receivedResults:(NSString *)externalAPIScope
         addPeopleControllerScope:(NSString *)addPeopleControllerScope
                            query:(NSString *)query
                          results:(NSArray *)results) {
    JitsiMeetView *view = [JitsiMeetView viewForExternalAPIScope:externalAPIScope];
    InviteController *controller = view.inviteController;
    [controller receivedResults:addPeopleControllerScope query:query results:results];
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
