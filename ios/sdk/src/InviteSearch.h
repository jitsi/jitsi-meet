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

@class InviteSearchController;

@protocol InviteSearchControllerDelegate

/**
 * Called when an InviteSearchController has results for a query that was previously provided.
 */
- (void)inviteSearchController:(InviteSearchController * _Nonnull)controller
             didReceiveResults:(NSArray<NSDictionary*> * _Nonnull)results
                      forQuery:(NSString * _Nonnull)query;

/**
 * Called when all invitations were sent successfully.
 */
- (void)inviteDidSucceedForSearchController:(InviteSearchController * _Nonnull)searchController;

/**
 * Called when one or more invitations fails to send successfully.
 */
- (void)inviteDidFailForItems:(NSArray<NSDictionary *> * _Nonnull)items
         fromSearchController:(InviteSearchController * _Nonnull)searchController;

@end

@interface InviteSearchController: NSObject

@property (nonatomic, nullable, weak) id<InviteSearchControllerDelegate> delegate;

- (void)performQuery:(NSString * _Nonnull)query;
- (void)cancelSearch;
- (void)submitSelectedItemIds:(NSArray<NSString *> * _Nonnull)ids;

@end
