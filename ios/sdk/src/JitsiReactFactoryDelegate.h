#import <Foundation/Foundation.h>
#import <RCTDefaultReactNativeFactoryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface JitsiReactFactoryDelegate : RCTDefaultReactNativeFactoryDelegate
- (BOOL)fabricEnabled;
- (BOOL)newArchEnabled;
- (BOOL)turboModuleEnabled;
- (BOOL)bridgelessEnabled;
@end

NS_ASSUME_NONNULL_END

