//
//  RoutesHandler.m
//  JitsiMeet
//
//  Created by Alex Bumbu on 19.10.2022.
//

#import "RoutesHandler.h"

@protocol Routing <NSObject>

@property (nonatomic, readonly) NSString *route;
@property (nonatomic, readonly) id<RouteObserving> observer;

@end

@interface Route: NSObject <Routing>

@property (nonatomic, readonly) NSString *route;
@property (nonatomic, readonly, weak) id<RouteObserving> observer;

+ (instancetype)routeWithString:(nonnull NSString *)route observer:(id<RouteObserving>)observer;

@end

#pragma mark -

@implementation RoutesHandler {
    NSMutableArray *routes;
}

+ (instancetype)sharedInstance {
    static RoutesHandler *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    
    return sharedInstance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        routes = [[NSMutableArray alloc] init];
    }
    
    return self;
}

- (void)registerObserver:(id<RouteObserving>)observer forRoute:(NSString *)route {
    [routes addObject:[Route routeWithString:route observer:observer]];
}

- (void)unregisterObserver:(id<RouteObserving>)observer {
    NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL(id<Routing> _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
        return evaluatedObject.observer == nil || evaluatedObject.observer == observer;
    }];
    NSArray *routesToClear = [routes filteredArrayUsingPredicate:predicate];
    [routes removeObjectsInArray:routesToClear];
}

- (BOOL)routeURL:(NSURL *)url {
    [self clearRoutes];
    
    NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:false];
    if (!components) {
        return false;
    }
        
    NSString *route = components.path;
    NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL(id<Routing> _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
        return [evaluatedObject.route isEqualToString:route];
    }];
    NSArray *routesToHandle = [routes filteredArrayUsingPredicate:predicate];
    if ([routesToHandle count] == 0) {
        return false;
    }
    
    for (id<Routing> route in routesToHandle) {
        route.observer.didRouteCallback(route.route);
    }
    
    return true;
}

- (void)clearRoutes {
    NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL(id<Routing> _Nullable evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
        return evaluatedObject.observer == nil;
    }];
    NSArray *routesToClear = [routes filteredArrayUsingPredicate:predicate];
    [routes removeObjectsInArray:routesToClear];
}

@end


#pragma mark -

@interface Route()

@property (nonatomic, nonnull, copy) NSString *route;
@property (nonatomic, weak) id<RouteObserving> observer;

@end

@implementation Route

+ (instancetype)routeWithString:(nonnull NSString *)route observer:(nonnull id<RouteObserving>)observer {
    return [[Route alloc] initWithString:route observer:observer];
}

- (instancetype)initWithString:(nonnull NSString *)route observer:(nonnull id<RouteObserving>)observer {
    self = [super init];
    if (self) {
        self.route = route;
        self.observer = observer;
    }
    
    return self;
}

@end
