#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeDelegate.h>

/**
 * A wrapper around the <tt>RCTBridge</tt> which implements the delegate methods
 * that allow us to serve the JS bundle from within the framework's resources
 * directory. This is the recommended way for those cases where the builtin API
 * doesn't cut it, as is the case.
 *
 * In addition, we will create a single bridge and then create all root views
 * off it, thus only loading the JS bundle a single time.
 */
@interface JitsiRCTBridge : NSObject<RCTBridgeDelegate>

@property (nonatomic, readonly, strong)  RCTBridge *bridge;

@end
