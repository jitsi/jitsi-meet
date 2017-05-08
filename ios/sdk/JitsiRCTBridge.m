#include "JitsiRCTBridge.h"


@implementation JitsiRCTBridge

- (instancetype)init
{
    self = [super init];

    if (self) {
        _bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
    }

    return self;
}

#pragma mark helper methods for getting the packager URL

#if DEBUG
static NSURL *serverRootWithHost(NSString *host)
{
    return [NSURL URLWithString:
            [NSString stringWithFormat:@"http://%@:8081/", host]];
}

- (BOOL)isPackagerRunning:(NSString *)host
{
    NSURL *url = [serverRootWithHost(host)
                  URLByAppendingPathComponent:@"status"];
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    NSURLResponse *response;
    NSData *data = [NSURLConnection sendSynchronousRequest:request
                                         returningResponse:&response
                                                     error:NULL];
    NSString *status = [[NSString alloc] initWithData:data
                                             encoding:NSUTF8StringEncoding];
    return [status isEqualToString:@"packager-status:running"];
}

- (NSString *)guessPackagerHost
{
    static NSString *ipGuess;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        NSString *ipPath = [[NSBundle bundleForClass:self.class]
                            pathForResource:@"ip" ofType:@"txt"];
        ipGuess = [[NSString stringWithContentsOfFile:ipPath
                                             encoding:NSUTF8StringEncoding
                                                error:nil]
                   stringByTrimmingCharactersInSet:
                   [NSCharacterSet newlineCharacterSet]];
    });

    NSString *host = ipGuess ?: @"localhost";
    if ([self isPackagerRunning:host]) {
        return host;
    }

    return nil;
}
#endif

#pragma mark RCTBridgeDelegate methods

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
    /**
     * In debug mode, try to fetch the bundle from the packager, or fallback to
     * the one inside the framework. The IP address for the packager host is
     * fetched from the ip.txt file inside the framework.
     *
     * This duplicates some functionality present in RCTBundleURLProvider, but
     * that mode is not designed to work inside a framework, because all
     * resources are loaded from the main bundle.
     */
    NSString *host = [self guessPackagerHost];
    if (host != nil) {
        NSString *path = @"/index.ios.bundle";
        NSString *query = @"platform=ios&dev=true&minify=false";
        NSURLComponents *components
        = [NSURLComponents componentsWithURL:serverRootWithHost(host)
                     resolvingAgainstBaseURL:NO];
        components.path = path;
        components.query = query;

        return components.URL;
    }
#endif

    return [self fallbackSourceURLForBridge:bridge];
}

- (NSURL *)fallbackSourceURLForBridge:(RCTBridge *)bridge
{
    return [[NSBundle bundleForClass:self.class] URLForResource:@"main"
                                                  withExtension:@"jsbundle"];
}

@end
