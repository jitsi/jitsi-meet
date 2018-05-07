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

#import "AddPeopleController+Private.h"
#import "InviteController+Private.h"

@implementation JMAddPeopleController

- (instancetype)initWithOwner:(JMInviteController *)owner {
    self = [super init];
    if (self) {
        _uuid = [[NSUUID UUID] UUIDString];
        _items = [[NSMutableDictionary alloc] init];
        _owner = owner;
    }
    return self;
}

#pragma mark API

- (void)endAddPeople {
    [self.owner endAddPeopleForController:self];
}

- (void)inviteById:(NSArray<NSString *> * _Nonnull)ids {
    NSMutableArray* invitees = [[NSMutableArray alloc] init];

    for (NSString* itemId in ids) {
        id invitee = [self.items objectForKey:itemId];

        if (invitee) {
            [invitees addObject:invitee];
        }
    }

    [self.owner invite:invitees forController:self];
}

- (void)performQuery:(NSString *)query {
    [self.owner performQuery:query forController:self];
}

#pragma mark Internal API, used to call the delegate and report to the user

- (void)receivedResults:(NSArray<NSDictionary *> *)results
               forQuery:(NSString *)query {
    for (NSDictionary* item in results) {
        NSString* itemId = item[@"id"];
        NSString* itemType = item[@"type"];
        if (itemId) {
            [self.items setObject:item forKey:itemId];
        } else if (itemType != nil && [itemType isEqualToString: @"phone"]) {
            NSString* number = item[@"number"];
            if (number) {
                [self.items setObject:item forKey:number];
            }
        }
    }

    [self.delegate addPeopleController:self
                     didReceiveResults:results
                              forQuery:query];
}

- (void)inviteSettled:(NSArray<NSDictionary *> *)failedInvitees {
    [self.delegate inviteSettled:failedInvitees fromSearchController:self];
}

@end
