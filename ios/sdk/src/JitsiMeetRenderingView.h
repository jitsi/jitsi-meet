//
//  JitsiMeetRenderingView.h
//  JitsiMeetSDK
//
//  Created by Alex Bumbu on 20.06.2022.
//  Copyright © 2022 Jitsi. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "JitsiMeetViewDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@interface JitsiMeetRenderingView : UIView

@property (nonatomic, strong, readonly) NSString *externalAPIScope;
@property (nonatomic, assign) BOOL isPiPEnabled;

- (void)setProps:(NSDictionary *_Nonnull)newProps;

+ (BOOL)setPropsInViews:(NSDictionary *_Nonnull)newProps;
+ (instancetype)viewForExternalAPIScope:(NSString *)externalAPIScope;

@end

NS_ASSUME_NONNULL_END
