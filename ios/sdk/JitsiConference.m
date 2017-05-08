#import <React/RCTRootView.h>

#import "JitsiConference.h"
#import "JitsiConference+Private.h"


@implementation JitsiConference

- (instancetype)initForURL:(NSURL *)url withBridge:(RCTBridge *) bridge
{
    self = [super init];
    
    if (self) {
        NSDictionary *props = url ? @{ url : url.absoluteString } : nil;
        RCTRootView *rootView =
            [[RCTRootView alloc] initWithBridge:bridge
                                     moduleName:@"App"
                              initialProperties:props];
        _view = rootView;
    }
    
    return self;
}

@end
