/*
 * Copyright @ 2019-present 8x8, Inc.
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

#import <React/RCTRootContentView.h>
#import <React/RCTLog.h>

#import "RNRootView.h"

@implementation RNRootView

// Monkey-patch RCTRootView.runApplication to avoid logging initial props.
- (void)runApplication:(RCTBridge *)bridge
{
    NSString *moduleName = [self valueForKey:@"_moduleName"] ?: @"";
    RCTRootContentView *_contentView = [self valueForKey:@"_contentView"];
    NSNumber *reactTag = [_contentView valueForKey:@"reactTag"];

    NSDictionary *appParameters = @{
                                    @"rootTag": reactTag,
                                    @"initialProps": self.appProperties ?: @{},
                                    };
#if DEBUG
    RCTLogInfo(@"Running application %@ (%@)", moduleName, appParameters);
#endif

    [bridge enqueueJSCall:@"AppRegistry"
                   method:@"runApplication"
                     args:@[moduleName, appParameters]
               completion:NULL];
}

@end
