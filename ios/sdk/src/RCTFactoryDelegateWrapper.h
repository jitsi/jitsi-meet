#import <Foundation/Foundation.h>
#import <RCTDefaultReactNativeFactoryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTDependencyProvider;

@interface RCTFactoryDelegateWrapper : RCTDefaultReactNativeFactoryDelegate
@property (nonatomic, strong) id<RCTDependencyProvider> dependencyProvider;
@end

NS_ASSUME_NONNULL_END

