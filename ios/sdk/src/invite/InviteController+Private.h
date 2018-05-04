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

@interface InviteController ()

@property (nonatomic, nullable) AddPeopleController *addPeopleController;

@property (nonatomic) NSString * _Nonnull externalAPIScope;

@property (nonatomic, nullable, weak) Invite *inviteModule;

- (instancetype _Nonnull)initWithExternalAPIScope:(NSString * _Nonnull)externalAPIScope
                         andInviteModule:(Invite * _Nonnull)inviteModule;

- (void)beginAddPeople;

- (void)endAddPeopleForController:(AddPeopleController * _Nonnull)controller;

- (void) invite:(NSArray * _Nonnull)invitees
  forController:(AddPeopleController * _Nonnull)controller;

- (void)inviteSettled:(NSString * _Nonnull)addPeopleControllerScope
       failedInvitees:(NSArray * _Nonnull)failedInvitees;

- (void)performQuery:(NSString * _Nonnull)query
       forController:(AddPeopleController * _Nonnull)controller;

- (void)receivedResults:(NSString * _Nonnull)addPeopleControllerScope
                  query:(NSString * _Nonnull)query
                results:(NSArray * _Nonnull)results;

@end
