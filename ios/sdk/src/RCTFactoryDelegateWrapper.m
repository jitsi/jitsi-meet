#import "RCTFactoryDelegateWrapper.h"

#import "JitsiMeet.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTBridge.h>

static NSString *JMReadMetroHostFromBundle(NSBundle *bundle) {
    NSString *ipPath = [bundle pathForResource:@"ip" ofType:@"txt"];
    if (ipPath.length == 0) {
        return nil;
    }

    NSError *error = nil;
    NSString *host = [NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding error:&error];
    if (error) {
        NSLog(@"⚠️ Failed to read ip.txt: %@", error);
        return nil;
    }

    return [host stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
}

@implementation RCTFactoryDelegateWrapper

- (instancetype)init {
    if (self = [super init]) {
        NSLog(@"🔵 RCTFactoryDelegateWrapper init called");
    }
    return self;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    return [self bundleURL];
}

- (NSURL *_Nullable)bundleURL {
#if DEBUG
    RCTBundleURLProvider *provider = [RCTBundleURLProvider sharedSettings];
    NSURL *bundleURL = [provider jsBundleURLForBundleRoot:@"index"];

    if (!bundleURL) {
        NSBundle *sdkBundle = [NSBundle bundleForClass:[JitsiMeet class]];
        NSString *host = JMReadMetroHostFromBundle(sdkBundle);
        if (host.length > 0) {
            NSString *port = [[[NSProcessInfo processInfo] environment] objectForKey:@"RCT_METRO_PORT"];
            if (port.length == 0) {
                port = [NSString stringWithFormat:@"%lu", (unsigned long)kRCTBundleURLProviderDefaultPort];
            }

            NSString *hostPort = [host containsString:@":"] ? host : [NSString stringWithFormat:@"%@:%@", host, port];
            provider.jsLocation = hostPort;

            bundleURL = [provider jsBundleURLForBundleRoot:@"index"];
        }
    }

    if (bundleURL) {
        return bundleURL;
    }
#else
    NSURL *bundleURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    if (bundleURL) {
        return bundleURL;
    }
#endif

    NSBundle *sdkBundle = [NSBundle bundleForClass:[JitsiMeet class]];
    return [sdkBundle URLForResource:@"main" withExtension:@"jsbundle"];
}

- (BOOL)fabricEnabled {
    NSLog(@"🔵 fabricEnabled called, returning NO");
    return NO;
}

- (BOOL)newArchEnabled {
    NSLog(@"🔵 newArchEnabled called, returning NO");
    return NO;
}

- (BOOL)turboModuleEnabled {
    NSLog(@"🔵 turboModuleEnabled called, returning NO");
    return NO;
}

- (BOOL)bridgelessEnabled {
    NSLog(@"🔵 bridgelessEnabled called, returning NO");
    return NO;
}

@end


