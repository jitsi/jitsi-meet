#import <Foundation/Foundation.h>

#import "JitsiConference.h"


@interface JitsiMeet : NSObject

+ (id)sharedInstance;

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *))restorationHandler;

- (JitsiConference *)conferenceForURL:(NSURL *)url;


@end
