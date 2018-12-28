/*
 * Copyright @ 2017-present Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@import MediaPlayer;


@interface MPVolumeViewManager : RCTViewManager
@end

@implementation MPVolumeViewManager

RCT_EXPORT_MODULE()

- (UIView *)view {
    MPVolumeView *volumeView = [[MPVolumeView alloc] init];
    volumeView.showsRouteButton = YES;
    volumeView.showsVolumeSlider = NO;

    return (UIView *) volumeView;
}

RCT_EXPORT_METHOD(show:(nonnull NSNumber *)reactTag) {
    [self.bridge.uiManager addUIBlock:^(
                __unused RCTUIManager *uiManager,
                NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[reactTag];
        if (![view isKindOfClass:[MPVolumeView class]]) {
            RCTLogError(@"Invalid view returned from registry, expecting \
                        MPVolumeView, got: %@", view);
        } else {
            // Simulate a click
            UIButton *btn = nil;
            for (UIView *buttonView in ((UIView *) view).subviews) {
                if ([buttonView isKindOfClass:[UIButton class]]) {
                    btn = (UIButton *) buttonView;
                    break;
                }
            }
            if (btn != nil) {
                [btn sendActionsForControlEvents:UIControlEventTouchUpInside];
            }
        }
    }];
}

@end
