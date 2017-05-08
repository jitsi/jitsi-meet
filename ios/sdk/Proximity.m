#import "RCTBridgeModule.h"

#import <UIKit/UIKit.h>

@interface Proximity : NSObject<RCTBridgeModule>
@end

@implementation Proximity

RCT_EXPORT_MODULE();

/**
 * Enables / disables the proximity sensor monitoring. On iOS enabling the
 * proximity sensor automatically dims the screen and disables touch controls,
 * so there is nothing else to do (unlike on Android)!
 *
 * @param enabled {@code YES} to enable proximity (sensor) monitoring;
 * {@code NO}, otherwise.
 */
RCT_EXPORT_METHOD(setEnabled:(BOOL)enabled) {
    [[UIDevice currentDevice] setProximityMonitoringEnabled:enabled];
}

@end
