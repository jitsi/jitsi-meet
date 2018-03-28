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

#import <React/RCTBridge.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>

#import "JitsiMeetView+Private.h"

#import "InviteSearch.h"

// The events emitted/supported by InviteSearch:
static NSString * const InviteSearchPerformQueryAction = @"performQueryAction";
static NSString * const InviteSearchPerformSubmitInviteAction = @"performSubmitInviteAction";


@interface InviteSearch : RCTEventEmitter

@end


@interface InviteSearchController ()

@property (nonatomic, readonly) NSString* _Nonnull identifier;
@property (nonatomic, strong) NSMutableDictionary* _Nonnull items;
@property (nonatomic, nullable, weak) InviteSearch* module;

- (instancetype)initWithSearchModule:(InviteSearch *)module;

- (void)didReceiveResults:(NSArray<NSDictionary*> * _Nonnull)results
                 forQuery:(NSString * _Nonnull)query;

- (void)inviteDidSucceed;

- (void)inviteDidFailForItems:(NSArray<NSDictionary *> *)items;

@end


@implementation InviteSearch

static NSMutableDictionary* searchControllers;

RCT_EXTERN void RCTRegisterModule(Class);

+ (void)load {
    RCTRegisterModule(self);

    searchControllers = [[NSMutableDictionary alloc] init];
}

+ (NSString *)moduleName {
    return @"InviteSearch";
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        InviteSearchPerformQueryAction,
        InviteSearchPerformSubmitInviteAction
    ];
}

/**
 * Calls the corresponding JitsiMeetView's delegate to request that the native
 * invite search be presented.
 *
 * @param scope
 */
RCT_EXPORT_METHOD(launchNativeInvite:(NSString *)scope) {
    // The JavaScript App needs to provide uniquely identifying information to
    // the native module so that the latter may match the former to the native
    // JitsiMeetView which hosts it.
    JitsiMeetView *view = [JitsiMeetView viewForExternalAPIScope:scope];

    if (!view) {
        return;
    }

    id<JitsiMeetViewDelegate> delegate = view.delegate;

    if (!delegate) {
        return;
    }

    if ([delegate respondsToSelector:@selector(launchNativeInviteForSearchController:)]) {
        InviteSearchController* searchController = [searchControllers objectForKey:scope];
        if (!searchController) {
            searchController = [self makeInviteSearchController];
        }

        [delegate launchNativeInviteForSearchController:searchController];
    }
}

RCT_EXPORT_METHOD(inviteSucceeded:(NSString *)inviteScope) {
    InviteSearchController* searchController = [searchControllers objectForKey:inviteScope];

    [searchController inviteDidSucceed];

    [searchControllers removeObjectForKey:inviteScope];
}

RCT_EXPORT_METHOD(inviteFailedForItems:(NSArray<NSDictionary *> *)items inviteScope:(NSString *)inviteScope) {
    InviteSearchController* searchController = [searchControllers objectForKey:inviteScope];

    [searchController inviteDidFailForItems:items];
}

RCT_EXPORT_METHOD(receivedResults:(NSArray *)results forQuery:(NSString *)query inviteScope:(NSString *)inviteScope) {

    InviteSearchController* searchController = [searchControllers objectForKey:inviteScope];

    [searchController didReceiveResults:results forQuery:query];
}

- (InviteSearchController *)makeInviteSearchController {
    InviteSearchController* searchController = [[InviteSearchController alloc] initWithSearchModule:self];

    [searchControllers setObject:searchController forKey:searchController.identifier];

    return searchController;
}

- (void)performQuery:(NSString * _Nonnull)query inviteScope:(NSString * _Nonnull)inviteScope  {
    [self sendEventWithName:InviteSearchPerformQueryAction body:@{ @"query": query, @"inviteScope": inviteScope }];
}

- (void)cancelSearchForInviteScope:(NSString * _Nonnull)inviteScope {
    [searchControllers removeObjectForKey:inviteScope];
}

- (void)submitSelectedItems:(NSArray<NSDictionary *> * _Nonnull)items inviteScope:(NSString * _Nonnull)inviteScope {
    [self sendEventWithName:InviteSearchPerformSubmitInviteAction body:@{ @"selectedItems": items, @"inviteScope": inviteScope }];
}

@end


@implementation InviteSearchController

- (instancetype)initWithSearchModule:(InviteSearch *)module {
    self = [super init];
    if (self) {
        _identifier = [[NSUUID UUID] UUIDString];

        self.items = [[NSMutableDictionary alloc] init];
        self.module = module;
    }
    return self;
}

- (void)performQuery:(NSString *)query {
    [self.module performQuery:query inviteScope:self.identifier];
}

- (void)cancelSearch {
    [self.module cancelSearchForInviteScope:self.identifier];
}

- (void)submitSelectedItemIds:(NSArray<NSString *> * _Nonnull)ids {
    NSMutableArray* items = [[NSMutableArray alloc] init];

    for (NSString* itemId in ids) {
        id item = [self.items objectForKey:itemId];

        if (item) {
            [items addObject:item];
        }
    }

    [self.module submitSelectedItems:items inviteScope:self.identifier];
}

- (void)didReceiveResults:(NSArray<NSDictionary *> *)results forQuery:(NSString *)query {
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

    [self.delegate inviteSearchController:self didReceiveResults:results forQuery:query];
}

- (void)inviteDidSucceed {
    [self.delegate inviteDidSucceedForSearchController:self];
}

- (void)inviteDidFailForItems:(NSArray<NSDictionary *> *)items {
    if (!items) {
        items = @[];
    }
    [self.delegate inviteDidFailForItems:items fromSearchController:self];
}

@end
