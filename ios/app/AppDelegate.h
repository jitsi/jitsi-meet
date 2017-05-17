#import <UIKit/UIKit.h>

#import <JitsiKit/JitsiKit.h>


@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) JitsiConference *conference;
@property (nonatomic, strong) UIWindow *window;

@end
