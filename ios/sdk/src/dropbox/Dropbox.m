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

#import <React/RCTBridgeModule.h>
#import <ObjectiveDropboxOfficial/ObjectiveDropboxOfficial.h>

#import "Dropbox.h"

RCTPromiseResolveBlock currentResolve = nil;
RCTPromiseRejectBlock currentReject = nil;

@implementation Dropbox

+ (NSString *)getAppKey{
    NSArray *urlTypes
        = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];

    for (NSDictionary<NSString *, NSArray *> *urlType in urlTypes) {
        NSArray *urlSchemes = urlType[@"CFBundleURLSchemes"];

        if (urlSchemes) {
            for (NSString *urlScheme in urlSchemes) {
                if (urlScheme && [urlScheme hasPrefix:@"db-"]) {
                    return [urlScheme substringFromIndex:3];
                }
            }
        }
    }
   
    return nil;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (NSDictionary *)constantsToExport {
    BOOL enabled = [Dropbox getAppKey] != nil;
    
    return @{
        @"ENABLED": [NSNumber numberWithBool:enabled]
    };
};

RCT_EXPORT_METHOD(authorize:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject) {
    currentResolve = resolve;
    currentReject = reject;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [DBClientsManager authorizeFromController:[UIApplication sharedApplication]
                                       controller:[[self class] topMostController]
                                          openURL:^(NSURL *url) {
                                              [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
                                          }];
    });
}

RCT_EXPORT_METHOD(getDisplayName: (NSString *)token
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    DBUserClient *client = [[DBUserClient alloc] initWithAccessToken:token];
    [[client.usersRoutes getCurrentAccount] setResponseBlock:^(DBUSERSFullAccount *result, DBNilObject *routeError, DBRequestError *networkError) {
        if (result) {
            resolve(result.name.displayName);
        } else {
            NSString *msg = @"Failed!";
            if (networkError) {
                msg = [NSString stringWithFormat:@"Failed! Error: %@", networkError];
            }
            reject(@"getDisplayName", @"Failed", nil);
        }
    }];

}

RCT_EXPORT_METHOD(getSpaceUsage: (NSString *)token
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    DBUserClient *client = [[DBUserClient alloc] initWithAccessToken:token];
    [[client.usersRoutes getSpaceUsage] setResponseBlock:^(DBUSERSSpaceUsage *result, DBNilObject *routeError, DBRequestError *networkError) {
        if (result) {
            DBUSERSSpaceAllocation *allocation = result.allocation;
            NSNumber *allocated = 0;
            NSNumber *used = 0;
            if ([allocation isIndividual]) {
                allocated = allocation.individual.allocated;
                used = result.used;
            } else if ([allocation isTeam]) {
                allocated = allocation.team.allocated;
                used = allocation.team.used;
            }
            id objects[] = { used, allocated };
            id keys[] = { @"used", @"allocated" };
            NSDictionary *dictionary = [NSDictionary dictionaryWithObjects:objects
                                            forKeys:keys
                                            count:2];
            resolve(dictionary);
        } else {
            NSString *msg = @"Failed!";
            if (networkError) {
                msg = [NSString stringWithFormat:@"Failed! Error: %@", networkError];
            }
            reject(@"getSpaceUsage", msg, nil);
        }
    }];

}

+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    if (currentReject == nil || currentResolve == nil) {
        return NO;
    }
    DBOAuthResult *authResult = [DBClientsManager handleRedirectURL:url];
    if (authResult) {
        if ([authResult isSuccess]) {
            currentResolve(authResult.accessToken.accessToken);
        } else {
            NSString *msg;
            if ([authResult isError]) {
                msg = [NSString stringWithFormat:@"%@, error type: %zd",[authResult errorDescription], [authResult errorType]];
            } else {
                msg = @"OAuth canceled!";
            }
            currentReject(@"authorize", msg, nil);
        }
        currentResolve = nil;
        currentReject = nil;

        return YES;
    }
    return NO;
}

+ (UIViewController *)topMostController {
    UIViewController *topController
        = [UIApplication sharedApplication].keyWindow.rootViewController;
    
    while (topController.presentedViewController) {
        topController = topController.presentedViewController;
    }
    
    return topController;
}

+ (void)setAppKey {
    NSString *appKey = [self getAppKey];

    if (appKey) {
        [DBClientsManager setupWithAppKey:appKey];
    }
}

@end
