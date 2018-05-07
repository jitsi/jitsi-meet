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

#import <Foundation/Foundation.h>

#import "AddPeopleController.h"

@class JMAddPeopleController;

@protocol JMAddPeopleControllerDelegate

/**
 * Called when a JMAddPeopleController has results for a query that was
 * previously provided.
 */
- (void)addPeopleController:(JMAddPeopleController * _Nonnull)controller
          didReceiveResults:(NSArray<NSDictionary *> * _Nonnull)results
                   forQuery:(NSString * _Nonnull)query;

/**
 * Called when a JMAddPeopleController has finished the inviting process, either
 * succesfully or not. In case of failure the failedInvitees array will contain
 * the items for which invitations failed.
 */
- (void) inviteSettled:(NSArray<NSDictionary *> * _Nonnull)failedInvitees
  fromSearchController:(JMAddPeopleController * _Nonnull)addPeopleController;

@end
