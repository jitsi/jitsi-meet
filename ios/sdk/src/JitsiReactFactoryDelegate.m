#import "JitsiReactFactoryDelegate.h"

#import "JitsiMeet.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTBridge.h>

static NSString *RCTReadMetroHostFromBundle(NSBundle *bundle) {
    NSString *ipPath = [bundle pathForResource:@"ip" ofType:@"txt"];
    if (ipPath.length == 0) {
        return nil;
    }

    NSError *error = nil;
    NSString *host = [NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding error:&error];
    if (error) {
        NSLog(@"Failed to read ip.txt: %@", error);
        return nil;
    }

    return [host stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
}

@implementation JitsiReactFactoryDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
    return [self bundleURL];
}

- (NSURL *_Nullable)bundleURL {
#if DEBUG
    RCTBundleURLProvider *provider = [RCTBundleURLProvider sharedSettings];
    NSURL *bundleURL = [provider jsBundleURLForBundleRoot:@"index"];

    if (!bundleURL) {
        // In the SDK the ip.txt used by RN's auto-detection lives inside the framework,
        // not the host app bundle, so copy the value into jsLocation manually.
        NSBundle *sdkBundle = [NSBundle bundleForClass:[self class]];
        NSString *host = RCTReadMetroHostFromBundle(sdkBundle);
        if (host.length > 0) {
            NSString *port = [[[NSProcessInfo processInfo] environment] objectForKey:@"RCT_METRO_PORT"]
                ?: [NSString stringWithFormat:@"%lu", (unsigned long)kRCTBundleURLProviderDefaultPort];

            NSString *hostPort = [host containsString:@":"] ? host : [NSString stringWithFormat:@"%@:%@", host, port];
            provider.jsLocation = hostPort;

            bundleURL = [provider jsBundleURLForBundleRoot:@"index"];
        }
    } else {
        return bundleURL;
    }
#endif

    NSBundle *sdkBundle = [NSBundle bundleForClass:[self class]];
    return [sdkBundle URLForResource:@"main" withExtension:@"jsbundle"];
}

- (BOOL)fabricEnabled {
    NSLog(@"fabricEnabled called, returning NO");
    return NO;
}       

- (BOOL)newArchEnabled {
    NSLog(@"newArchEnabled called, returning NO");
    return NO;
}

- (BOOL)turboModuleEnabled {
    NSLog(@"turboModuleEnabled called, returning NO");
    return NO;
}

- (BOOL)bridgelessEnabled {
    NSLog(@"bridgelessEnabled called, returning NO");
    return NO;
}

@end

