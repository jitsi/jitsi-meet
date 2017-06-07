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

#import <CoreText/CoreText.h>

#import <React/RCTAssert.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTRootView.h>

#import "JitsiMeetView.h"
#import "RCTBridgeWrapper.h"

/**
 * A <tt>RCTFatalHandler</tt> implementation which swallows JavaScript errors.
 * In the Release configuration, React Native will (intentionally) raise an
 * unhandled NSException for an unhandled JavaScript error. This will
 * effectively kill the application. <tt>_RCTFatal</tt> is suitable to be in
 * accord with the Web i.e. not kill the application.
 */
RCTFatalHandler _RCTFatal = ^(NSError *error) {
    id jsStackTrace = error.userInfo[RCTJSStackTraceKey];
    @try {
        NSString *name
            = [NSString stringWithFormat:@"%@: %@",
               RCTFatalExceptionName, error.localizedDescription];
        NSString *message
            = RCTFormatError(error.localizedDescription, jsStackTrace, 75);
        [NSException raise:name format:@"%@", message];
    } @catch (NSException *e) {
        if (!jsStackTrace) {
            @throw;
        }
    }
};

@interface JitsiMeetView() {
    RCTRootView *rootView;
}

@end

@implementation JitsiMeetView

static RCTBridgeWrapper *bridgeWrapper;
static JitsiMeetView *instance;

#pragma mark Linking delegate helpers
// https://facebook.github.io/react-native/docs/linking.html

+    (BOOL)application:(UIApplication *)application
  continueUserActivity:(NSUserActivity *)userActivity
    restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{
    return [RCTLinkingManager application:application
                     continueUserActivity:userActivity
                       restorationHandler:restorationHandler];
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation {
    return [RCTLinkingManager application:application
                                  openURL:url
                        sourceApplication:sourceApplication
                               annotation:annotation];
}

#pragma mark initializers

- (instancetype)initWithCoder:(NSCoder *)coder {
    self = [super initWithCoder:coder];
    if (self) {
        [self initialize];
    }

    return self;
}

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self initialize];
    }

    return self;
}

#pragma mark API

/*
 * Loads the given URL and joins the specified conference. If the specified URL
 * is null, the welcome page is shown.
 */
- (void)loadURL:(NSURL *)url {
    NSDictionary *props = url ? @{ url : url.absoluteString } : nil;

    if (rootView == nil) {
        rootView
            = [[RCTRootView alloc] initWithBridge:bridgeWrapper.bridge
                                       moduleName:@"App"
                                initialProperties:props];
        rootView.backgroundColor = self.backgroundColor;

        // Add React's root view as a subview which completely covers this one.
        [rootView setFrame:[self bounds]];
        [self addSubview:rootView];
    } else {
        // Update props with the new URL.
        rootView.appProperties = props;
    }
}

#pragma mark private methods

+ (instancetype)getInstance {
    return instance;
}

/*
 * Internal initialization:
 *
 *   - sets the backgroudn color
 *   - creates the React bridge
 *   - loads the necessary custom fonts
 *   - registers a custom fatal error error handler for React
 */
- (void)initialize {
    static dispatch_once_t onceToken;

    /*
     * TODO: Only allow a single instance for now. All React Native modules are
     * kinda singletons so global state would be broken since we have a single
     * bridge. Once we have that sorted out multiple instances of JitsiMeetView
     * will be allowed.
     */
    if (instance != nil) {
        @throw [NSException
            exceptionWithName:@"RuntimeError"
                       reason:@"Only a single instance is currently allowed"
                     userInfo:nil];
    }
    instance = self;

    dispatch_once(&onceToken, ^{
        // Set a background color which is in accord with the JavaScript and
        // Android parts of the application and causes less perceived visual
        // flicker than the default background color.
        self.backgroundColor
            = [UIColor colorWithRed:.07f green:.07f blue:.07f alpha:1];

        // Initialize the React bridge.
        bridgeWrapper = [[RCTBridgeWrapper alloc] init];

        // Dynamically load custom bundled fonts.
        [self loadCustomFonts];

        // Register a fatal error handler for React.
        [self registerFatalErrorHandler];
    });
}

/*
 * Helper function to dynamically load custom fonts. The UIAppFonts key in the
 * plist file doesn't work for frameworks, so fonts have to be manually loaded.
 */
- (void)loadCustomFonts {
    NSBundle *bundle = [NSBundle bundleForClass:self.class];
    NSArray *fonts = [bundle objectForInfoDictionaryKey:@"JitsiMeetFonts"];

    for (NSString *item in fonts) {
        NSString *fontName = [item stringByDeletingPathExtension];
        NSString *fontExt = [item pathExtension];
        NSString *fontPath = [bundle pathForResource:fontName ofType:fontExt];
        NSData *inData = [NSData dataWithContentsOfFile:fontPath];
        CFErrorRef error;
        CGDataProviderRef provider
            = CGDataProviderCreateWithCFData((__bridge CFDataRef)inData);
        CGFontRef font = CGFontCreateWithDataProvider(provider);

        if (!CTFontManagerRegisterGraphicsFont(font, &error)) {
            CFStringRef errorDescription = CFErrorCopyDescription(error);

            NSLog(@"Failed to load font: %@", errorDescription);
            CFRelease(errorDescription);
        }
        CFRelease(font);
        CFRelease(provider);
    }
}

/*
 * Helper function to register a fatal error handler for React. Our handler
 * won't kill the process, it will swallow JS errors and print stack traces
 * instead.
 */
- (void)registerFatalErrorHandler {
#if !DEBUG
    // In the Release configuration, React Native will (intentionally) raise
    // an unhandled NSException for an unhandled JavaScript error. This will
    // effectively kill the application. In accord with the Web, do not kill
    // the application.
    if (!RCTGetFatalHandler()) {
        RCTSetFatalHandler(_RCTFatal);
    }
#endif
}

@end
