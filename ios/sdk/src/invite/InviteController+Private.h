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

#import "InviteController.h"

#import "AddPeopleController.h"
#import "Invite+Private.h"
#import "RCTBridgeWrapper.h"

@interface JMInviteController ()

@property (nonatomic, nullable) JMAddPeopleController *addPeopleController;

@property (nonatomic) NSString * _Nonnull externalAPIScope;

@property (nonatomic, nullable, weak) RCTBridgeWrapper *bridgeWrapper;

@property (nonatomic, readonly) Invite * _Nullable inviteModule;

- (instancetype _Nonnull)initWithExternalAPIScope:(NSString * _Nonnull)externalAPIScope
                                    bridgeWrapper:(RCTBridgeWrapper * _Nullable)bridgeWrapper;

- (void)beginAddPeople;

- (void)endAddPeopleForController:(JMAddPeopleController * _Nonnull)controller;

- (void) invite:(NSArray * _Nonnull)invitees
  forController:(JMAddPeopleController * _Nonnull)controller;

- (void)inviteSettled:(NSString * _Nonnull)addPeopleControllerScope
       failedInvitees:(NSArray * _Nonnull)failedInvitees;

- (void)performQuery:(NSString * _Nonnull)query
       forController:(JMAddPeopleController * _Nonnull)controller;

- (void)receivedResults:(NSString * _Nonnull)addPeopleControllerScope
                  query:(NSString * _Nonnull)query
                results:(NSArray * _Nonnull)results;

@end
