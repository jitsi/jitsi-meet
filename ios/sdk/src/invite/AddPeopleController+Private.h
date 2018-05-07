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

#import "AddPeopleController.h"
#import "InviteController.h"

@interface JMAddPeopleController ()

@property (nonatomic, strong) NSMutableDictionary* _Nonnull items;
@property (nonatomic, weak, nullable) JMInviteController *owner;
@property (nonatomic, readonly) NSString* _Nonnull uuid;

- (instancetype _Nonnull)initWithOwner:(JMInviteController * _Nonnull)owner;

- (void)inviteSettled:(NSArray<NSDictionary *> * _Nonnull)failedInvitees;

- (void)receivedResults:(NSArray<NSDictionary*> * _Nonnull)results
               forQuery:(NSString * _Nonnull)query;

@end
