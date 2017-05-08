#import <CoreText/CoreText.h>

#import <React/RCTAssert.h>
#import <React/RCTLinkingManager.h>

#import "JitsiMeet.h"
#import "JitsiConference+Private.h"
#import "JitsiRCTBridge.h"


/**
 * A <tt>RCTFatalHandler</tt> implementation which swallows JavaScript errors.
 * In the Release configuration, React Native will (intentionally) raise an
 * unhandled NSException for an unhandled JavaScript error. This will
 * effectively kill the application. <tt>_RCTFatal</tt> is suitable to be in
 * accord with the Web i.e. not kill the application.
 */
RCTFatalHandler _RCTFatal = ^(NSError *error)
{
    id jsStackTrace = error.userInfo[RCTJSStackTraceKey];
    @try {
        NSString *name
        = [NSString stringWithFormat:@"%@: %@",
           RCTFatalExceptionName,
           error.localizedDescription];
        NSString *message
        = RCTFormatError(error.localizedDescription, jsStackTrace, 75);
        [NSException raise:name format:@"%@", message];
    } @catch (NSException *e) {
        if (!jsStackTrace) {
            @throw;
        }
    }
};


/**
 * Main entrypoint to JitsiKit. JitsiMeet is the singleton object which exposes
 * our API to consumers.
 */
@implementation JitsiMeet
{
    JitsiRCTBridge *_jitsiBridge;
}

#pragma mak public API

+ (id)sharedInstance
{
    static JitsiMeet *sharedInstance = nil;
    static dispatch_once_t onceToken;
    
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
        sharedInstance->_jitsiBridge = [[JitsiRCTBridge alloc] init];
        
        [sharedInstance loadCustomFonts];
        [sharedInstance registerFatalErrorHandler];
    });
    
    return sharedInstance;
}

- (JitsiConference *)conferenceForURL:(NSURL *)url
{
    return [[JitsiConference alloc] initForURL:url
                                    withBridge:self->_jitsiBridge.bridge];
}

#pragma mark linking delegate helpers
// https://facebook.github.io/react-native/docs/linking.html

+ (BOOL)application:(UIApplication *)application
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
         annotation:(id)annotation
{
    return [RCTLinkingManager application:application
                                  openURL:url
                        sourceApplication:sourceApplication
                               annotation:annotation];
}

#pragma mark private methods

- (void)loadCustomFonts
{
    NSBundle *bundle = [NSBundle bundleForClass:self.class];
    NSArray *fonts = [bundle objectForInfoDictionaryKey:@"JitsiKitFonts"];

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

- (void)registerFatalErrorHandler
{
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
