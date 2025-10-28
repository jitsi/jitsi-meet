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

#import "Orientation.h"

#import "JitsiMeet+Private.h"
#import "JitsiMeetConferenceOptions+Private.h"
#import "JitsiMeetView+Private.h"
#import "ReactUtils.h"
#import "ScheenshareEventEmiter.h"

#import <react-native-webrtc/WebRTCModuleOptions.h>
#import <RCTReactNativeFactory.h>
#import <RCTDefaultReactNativeFactoryDelegate.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#if !defined(JITSI_MEET_SDK_LITE)
#import <RNGoogleSignin/RNGoogleSignin.h>
#import "Dropbox.h"
#endif

@interface JMReactNativeFactoryDelegate : RCTDefaultReactNativeFactoryDelegate
@property (nonatomic, strong) id<RCTDependencyProvider> dependencyProvider;
@end

@implementation JMReactNativeFactoryDelegate

@synthesize dependencyProvider = _dependencyProvider;

- (instancetype)init {
    if (self = [super init]) {
        NSLog(@"🔵 JMReactNativeFactoryDelegate init called");
    }
    return self;
}

- (void)setDependencyProvider:(id<RCTDependencyProvider>)dependencyProvider {
    _dependencyProvider = dependencyProvider;
    NSLog(@"🔵 dependencyProvider set: %@", dependencyProvider);
    NSLog(@"🔵 dependencyProvider class: %@", [dependencyProvider class]);
}

- (id<RCTDependencyProvider>)dependencyProvider {
    NSLog(@"🔵 dependencyProvider getter called, returning: %@", _dependencyProvider);
    return _dependencyProvider;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    return [self bundleURL];
}

- (NSURL *_Nullable)bundleURL {
#if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)fabricEnabled {
    NSLog(@"🔵 fabricEnabled called, returning NO");
    return NO;
}

- (BOOL)turboModuleEnabled {
    NSLog(@"🔵 turboModuleEnabled called, returning YES");
    return YES;
}

- (BOOL)bridgelessEnabled {
    NSLog(@"🔵 bridgelessEnabled called, returning NO");
    return NO;
}

@end

@implementation JitsiMeet {
    NSDictionary *_launchOptions;
    ScheenshareEventEmiter *_screenshareEventEmiter;
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
        NSLog(@"🔵 JitsiMeet init started");
        
        // Initialize WebRTC options.
        self.rtcAudioDevice = nil;
        self.webRtcLoggingSeverity = WebRTCLoggingSeverityNone;
        
        NSLog(@"🔵 Creating JMReactNativeFactoryDelegate");
        JMReactNativeFactoryDelegate *delegate = [[JMReactNativeFactoryDelegate alloc] init];
        
        NSLog(@"🔵 Creating RCTAppDependencyProvider");
        id<RCTDependencyProvider> provider = [[RCTAppDependencyProvider alloc] init];
        NSLog(@"🔵 RCTAppDependencyProvider created: %@", provider);
        
        NSLog(@"🔵 Setting dependencyProvider on delegate");
        delegate.dependencyProvider = provider;
        
        NSLog(@"🔵 Creating RCTReactNativeFactory with delegate");
        self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:delegate];
        NSLog(@"🔵 RCTReactNativeFactory created: %@", self.reactNativeFactory);
        
        self.dependencyProvider = delegate.dependencyProvider;
        NSLog(@"🔵 JitsiMeet.dependencyProvider set to: %@", self.dependencyProvider);

        // Initialize the listener for handling start/stop screensharing notifications.
        _screenshareEventEmiter = [[ScheenshareEventEmiter alloc] init];

        // Register a fatal error handler for React.
        registerReactFatalErrorHandler();

        // Register a log handler for React.
        registerReactLogHandler();
    }

    return self;
}

#pragma mark - Methods that the App delegate must call

-             (BOOL)application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
                     moduleName:(NSString *)moduleName
                       inWindow:(UIWindow *)window {

    _launchOptions = [launchOptions copy];
    
    // Start React Native with new architecture
    [self.reactNativeFactory startReactNativeWithModuleName:moduleName
                                                   inWindow:window
                                          initialProperties:nil
                                              launchOptions:launchOptions];

#if !defined(JITSI_MEET_SDK_LITE)
    [Dropbox setAppKey];
#endif

    return YES;
}

-    (BOOL)application:(UIApplication *)application
  continueUserActivity:(NSUserActivity *)userActivity
    restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> *))restorationHandler {

    JitsiMeetConferenceOptions *options = [self optionsFromUserActivity:userActivity];
    if (options) {
        [JitsiMeetView updateProps:[options asProps]];
        return true;
    }

    return false;
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {

#if !defined(JITSI_MEET_SDK_LITE)
    if ([Dropbox application:app openURL:url options:options]) {
        return YES;
    }

    if ([RNGoogleSignin application:app
                            openURL:url
                            options:options]) {
        return YES;
    }
#endif

    if (_customUrlScheme == nil || ![_customUrlScheme isEqualToString:url.scheme]) {
        return NO;
    }

    JitsiMeetConferenceOptions *conferenceOptions = [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
        builder.room = [url absoluteString];
    }];
    [JitsiMeetView updateProps:[conferenceOptions asProps]];

    return true;
}

- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window {
    return [Orientation getOrientation];
}

#pragma mark - Utility methods

- (void)instantiateReactNativeBridge {
    // Initialize WebRTC options.
    WebRTCModuleOptions *options = [WebRTCModuleOptions sharedInstance];
    options.audioDevice = _rtcAudioDevice;
    options.loggingSeverity = (RTCLoggingSeverity)_webRtcLoggingSeverity;


}

- (void)destroyReactNativeBridge {
    [self.reactNativeFactory.bridge invalidate];
    self.reactNativeFactory = nil;
}

- (JitsiMeetConferenceOptions *)getInitialConferenceOptions {
    if (_launchOptions[UIApplicationLaunchOptionsURLKey]) {
        NSURL *url = _launchOptions[UIApplicationLaunchOptionsURLKey];
        return [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
            builder.room = [url absoluteString];
        }];
    } else {
        NSDictionary *userActivityDictionary
            = _launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];
        NSUserActivity *userActivity
            = [userActivityDictionary objectForKey:@"UIApplicationLaunchOptionsUserActivityKey"];
        if (userActivity != nil) {
            return [self optionsFromUserActivity:userActivity];
        }
    }

    return nil;
}

- (BOOL)isCrashReportingDisabled {
    NSUserDefaults *userDefaults = [[NSUserDefaults alloc] initWithSuiteName:@"jitsi-default-preferences"];
    return [userDefaults stringForKey:@"isCrashReportingDisabled"];
}

- (JitsiMeetConferenceOptions *)optionsFromUserActivity:(NSUserActivity *)userActivity {
    NSString *activityType = userActivity.activityType;

    if ([activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        // App was started by opening a URL in the browser
        NSURL *url = userActivity.webpageURL;
        if ([_universalLinkDomains containsObject:url.host]) {
            return [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
                builder.room = [url absoluteString];
            }];
        }
    } else if ([activityType isEqualToString:@"INStartAudioCallIntent"]
               || [activityType isEqualToString:@"INStartVideoCallIntent"]) {
        // App was started by a CallKit Intent
        INIntent *intent = userActivity.interaction.intent;
        NSArray<INPerson *> *contacts;
        NSString *url;
        BOOL audioOnly = NO;

        if ([intent isKindOfClass:[INStartAudioCallIntent class]]) {
            contacts = ((INStartAudioCallIntent *) intent).contacts;
            audioOnly = YES;
        } else if ([intent isKindOfClass:[INStartVideoCallIntent class]]) {
            contacts = ((INStartVideoCallIntent *) intent).contacts;
        }

        if (contacts && (url = contacts.firstObject.personHandle.value)) {
            return [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
                builder.audioOnly = audioOnly;
                builder.room = url;
            }];
        }
    } else if (self.conferenceActivityType && [activityType isEqualToString:self.conferenceActivityType]) {
        // App was started by continuing a registered NSUserActivity (SiriKit, Handoff, ...)
        NSString *url;

        if ((url = userActivity.userInfo[@"url"])) {
            return [JitsiMeetConferenceOptions fromBuilder:^(JitsiMeetConferenceOptionsBuilder *builder) {
                builder.room = url;
            }];
        }
    }

    return nil;
}

- (void)showSplashScreen {
    Class splashClass = NSClassFromString(@"SplashView");
    if (splashClass && [splashClass respondsToSelector:@selector(sharedInstance)]) {
        id splashInstance = [splashClass performSelector:@selector(sharedInstance)];
        if (splashInstance && [splashInstance respondsToSelector:@selector(showSplash)]) {
            [splashInstance performSelector:@selector(showSplash)];
            NSLog(@"✅ Splash Screen Shown Successfully");
        }
    } else {
        NSLog(@"⚠️ SplashView module not found");
    }
}

#pragma mark - Property getter / setters

- (NSArray<NSString *> *)universalLinkDomains {
    return _universalLinkDomains ? _universalLinkDomains : @[];
}

- (void)setDefaultConferenceOptions:(JitsiMeetConferenceOptions *)defaultConferenceOptions {
    
    // For testing configOverrides a room needs to be set,
    // thus the following check needs to be commented out
    if (defaultConferenceOptions != nil && defaultConferenceOptions.room != nil) {
        @throw [NSException exceptionWithName:@"RuntimeError"
                                       reason:@"'room' must be null in the default conference options"
                                     userInfo:nil];
    }
    _defaultConferenceOptions = defaultConferenceOptions;
}

#pragma mark - Private API methods

- (NSDictionary *)getDefaultProps {
    return _defaultConferenceOptions == nil ? @{} : [_defaultConferenceOptions asProps];
}

- (RCTBridge *)getReactBridge {
    // Initialize bridge lazily.
    [self instantiateReactNativeBridge];
    
    NSLog(@"🔵 getReactBridge called");
    NSLog(@"🔵 reactNativeFactory: %@", self.reactNativeFactory);
    NSLog(@"🔵 reactNativeFactory.bridge: %@", self.reactNativeFactory.bridge);
    
    // Get bridge from the new architecture factory
    return self.reactNativeFactory.bridge;
}

- (ExternalAPI *)getExternalAPI {
    RCTBridge *bridge = [self getReactBridge];
    return [bridge moduleForClass:ExternalAPI.class];
}

@end
