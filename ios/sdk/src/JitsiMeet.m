/*
 * Copyright @ 2019-present 8x8, Inc.
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

#import <Intents/Intents.h>

#import "Dropbox.h"
#import "JitsiMeet+Private.h"
#import "JitsiMeetView+Private.h"
#import "RCTBridgeWrapper.h"
#import "ReactUtils.h"

#import <RNGoogleSignin/RNGoogleSignin.h>


@implementation JitsiMeet {
    RCTBridgeWrapper *_bridgeWrapper;
    NSDictionary *_launchOptions;
}

#pragma mak - This class is a singleton

+ (instancetype)sharedInstance {
    static JitsiMeet *sharedInstance = nil;
    static dispatch_once_t onceToken;

    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });

    return sharedInstance;
}

- (instancetype)init {
    if (self = [super init]) {
        // Initialize the on and only bridge for interfacing with React Native.
        _bridgeWrapper = [[RCTBridgeWrapper alloc] init];

        // Register a fatal error handler for React.
        registerReactFatalErrorHandler();
    }

    return self;
}

#pragma mark - Methods that the App delegate must call

-             (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    _launchOptions = [launchOptions copy];

    [Dropbox setAppKey];

    return YES;
}

-    (BOOL)application:(UIApplication *)application
  continueUserActivity:(NSUserActivity *)userActivity
    restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler {

    id url = [self urlFromUserActivity:userActivity];

    return url && [JitsiMeetView loadURLInViews:url];
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {

    if ([Dropbox application:app openURL:url options:options]) {
        return YES;
    }

    if ([RNGoogleSignin application:app
                            openURL:url
                  sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]
                         annotation:options[UIApplicationOpenURLOptionsAnnotationKey]]) {
        return YES;
    }

    if (![_customUrlScheme isEqualToString:url.scheme]) {
        return NO;
    }

    return [JitsiMeetView loadURLInViews:@{ @"url" : url.absoluteString }];
}

#pragma mark - Utility methods

- (NSDictionary *)getInitialURL {
    if (_launchOptions[UIApplicationLaunchOptionsURLKey]) {
        NSURL *url = _launchOptions[UIApplicationLaunchOptionsURLKey];
        return @{ @"url" : url.absoluteString };
    } else {
        NSDictionary *userActivityDictionary
            = _launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];
        NSUserActivity *userActivity
            = [userActivityDictionary objectForKey:@"UIApplicationLaunchOptionsUserActivityKey"];
        if (userActivity != nil) {
            return [self urlFromUserActivity:userActivity];
        }
    }

    return nil;
}

- (NSDictionary *)urlFromUserActivity:(NSUserActivity *)userActivity {
    NSString *activityType = userActivity.activityType;

    if ([activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        // App was started by opening a URL in the browser
        NSURL *url = userActivity.webpageURL;
        if ([_universalLinkDomains containsObject:url.host]) {
            return @{ @"url" : url.absoluteString };
        }
    } else if ([activityType isEqualToString:@"INStartAudioCallIntent"]
               || [activityType isEqualToString:@"INStartVideoCallIntent"]) {
        // App was started by a CallKit Intent
        INIntent *intent = userActivity.interaction.intent;
        NSArray<INPerson *> *contacts;
        NSString *url;
        BOOL startAudioOnly = NO;

        if ([intent isKindOfClass:[INStartAudioCallIntent class]]) {
            contacts = ((INStartAudioCallIntent *) intent).contacts;
            startAudioOnly = YES;
        } else if ([intent isKindOfClass:[INStartVideoCallIntent class]]) {
            contacts = ((INStartVideoCallIntent *) intent).contacts;
        }

        if (contacts && (url = contacts.firstObject.personHandle.value)) {
            return @{
                     @"config": @{@"startAudioOnly":@(startAudioOnly)},
                     @"url": url
                     };
        }
    } else if (self.conferenceActivityType && [activityType isEqualToString:self.conferenceActivityType]) {
        // App was started by continuing a registered NSUserActivity (SiriKit, Handoff, ...)
        NSString *url;

        if ((url = userActivity.userInfo[@"url"])) {
            return @{ @"url" : url };
        }
    }

    return nil;
}

#pragma mark - Property getter / setters

- (NSString *)customUrlScheme {
    return _customUrlScheme ? _customUrlScheme : @"org.jitsi.meet";
}

- (NSArray<NSString *> *)universalLinkDomains {
    return _universalLinkDomains ? _universalLinkDomains : @[@"meet.jit.si"];
}

#pragma mark - Private API methods

- (RCTBridge *)getReactBridge {
    return _bridgeWrapper.bridge;
}

@end
