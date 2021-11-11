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

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>

@interface Proximity : NSObject<RCTBridgeModule>
@end

@implementation Proximity

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

/**
 * Enables / disables the proximity sensor monitoring. On iOS enabling the
 * proximity sensor automatically dims the screen and disables touch controls,
 * so there is nothing else to do (unlike on Android)!
 *
 * @param enabled `YES` to enable proximity (sensor) monitoring; `NO`,
 * otherwise.
 */
RCT_EXPORT_METHOD(setEnabled:(BOOL)enabled) {
    [[UIDevice currentDevice] setProximityMonitoringEnabled:enabled];
}

@end
