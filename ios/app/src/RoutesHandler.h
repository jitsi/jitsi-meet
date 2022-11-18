//
//  RoutesHandler.h
//  JitsiMeet
//
//  Created by Alex Bumbu on 19.10.2022.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RouteObserving <NSObject>

@property (nonatomic, readonly) void (^didRouteCallback)(NSString *route);

@end

@interface RoutesHandler : NSObject

+ (instancetype)sharedInstance;
- (void)registerObserver:(id<RouteObserving>)observer forRoute:(NSString *)route;
- (void)unregisterObserver:(id<RouteObserving>)observer;
- (BOOL)routeURL:(NSURL *)url;

@end

NS_ASSUME_NONNULL_END
