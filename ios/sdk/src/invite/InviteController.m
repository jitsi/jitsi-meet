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

#import "InviteController+Private.h"
#import "AddPeopleController+Private.h"

@implementation JMInviteController {
    NSNumber *_addPeopleEnabled;
    NSNumber *_dialOutEnabled;
}

@dynamic addPeopleEnabled;
@dynamic dialOutEnabled;

#pragma mark Constructor

-(instancetype)initWithExternalAPIScope:(NSString * _Nonnull)externalAPIScope
                          bridgeWrapper:(RCTBridgeWrapper * _Nullable)bridgeWrapper {
    self = [super init];
    if (self) {
        self.externalAPIScope = externalAPIScope;
        self.bridgeWrapper = bridgeWrapper;
    }

    return self;
}

#pragma mark Public API

-(Invite * _Nullable)inviteModule {
    return [self.bridgeWrapper.bridge moduleForName:@"Invite"];
}

-(void)beginAddPeople {
    if (_delegate == nil) {
        return;
    }

    if (_addPeopleController != nil) {
        return;
    }

    _addPeopleController = [[JMAddPeopleController alloc] initWithOwner:self];

    @try {
        if (self.delegate
                && [self.delegate respondsToSelector:@selector(beginAddPeople:)]) {
            [self.delegate beginAddPeople:_addPeopleController];
        }
    } @catch (NSException *e) {
        [self endAddPeopleForController:_addPeopleController];
    }
}

-(void)endAddPeopleForController:(JMAddPeopleController *)controller {
    if (self.addPeopleController == controller) {
        self.addPeopleController = nil;
    }
}

#pragma mark Property getters / setters

- (void) setAddPeopleEnabled:(BOOL)addPeopleEnabled {
    _addPeopleEnabled = [NSNumber numberWithBool:addPeopleEnabled];
}

- (BOOL) addPeopleEnabled {
    if (_addPeopleEnabled == nil || [_addPeopleEnabled boolValue]) {
        return self.delegate
            && [self.delegate respondsToSelector:@selector(beginAddPeople:)];
    }

    return NO;
}

- (void) setDialOutEnabled:(BOOL)dialOutEnabled {
    _dialOutEnabled = [NSNumber numberWithBool:dialOutEnabled];
}

- (BOOL) dialOutEnabled {
    if (_dialOutEnabled == nil || [_dialOutEnabled boolValue]) {
        return self.delegate
            && [self.delegate respondsToSelector:@selector(beginAddPeople:)];
    }

    return NO;
}

#pragma mark Result handling

- (void)inviteSettled:(NSString *)addPeopleControllerScope
       failedInvitees:(NSArray *)failedInvitees {
    JMAddPeopleController *controller = self.addPeopleController;

    if (controller != nil
            && [controller.uuid isEqualToString:addPeopleControllerScope]) {
        @try {
            [controller inviteSettled:failedInvitees];
        } @finally {
            if ([failedInvitees count] == 0) {
                [self endAddPeopleForController:controller];
            }
        }
    }
}

- (void)receivedResults:(NSString *)addPeopleControllerScope
                  query:(NSString *)query
                results:(NSArray *)results {
    JMAddPeopleController *controller = self.addPeopleController;

    if (controller != nil
            && [controller.uuid isEqualToString:addPeopleControllerScope]) {
        [controller receivedResults:results forQuery:query];
    }
}

#pragma mark Use the Invite react-native module to emit the search / submission events

- (void) invite:(NSArray *)invitees
  forController:(JMAddPeopleController * _Nonnull)controller {
    [self        invite:invitees
     forControllerScope:controller.uuid];
}

- (void)      invite:(NSArray *)invitees
  forControllerScope:(NSString * _Nonnull)controllerScope {
    [self.inviteModule invite:invitees
             externalAPIScope:self.externalAPIScope
     addPeopleControllerScope:controllerScope];
}

- (void)  invite:(NSArray *)invitees
  withCompletion:(void (^)(NSArray<NSDictionary *> *failedInvitees))completion {
    // TODO Execute the specified completion block when the invite settles.
    [self        invite:invitees
     forControllerScope:[[NSUUID UUID] UUIDString]];
}

- (void)performQuery:(NSString * _Nonnull)query
       forController:(JMAddPeopleController * _Nonnull)controller {
    [self.inviteModule performQuery:query
                   externalAPIScope:self.externalAPIScope
           addPeopleControllerScope:controller.uuid];
}

@end
