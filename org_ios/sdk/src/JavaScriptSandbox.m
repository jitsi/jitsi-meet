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

@import JavaScriptCore;

#import <React/RCTBridgeModule.h>


@interface JavaScriptSandbox : NSObject<RCTBridgeModule>
@end

@implementation JavaScriptSandbox

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

#pragma mark - Exported methods

RCT_EXPORT_METHOD(evaluate:(NSString *)code
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    __block BOOL hasError = NO;
    JSContext *ctx = [[JSContext alloc] init];
    ctx.exceptionHandler = ^(JSContext *context, JSValue *exception) {
        hasError = YES;
        reject(@"evaluate", [exception toString], nil);
    };
    JSValue *ret = [ctx evaluateScript:code];
    if (!hasError) {
        NSString *result = [ret toString];
        if (result == nil) {
            reject(@"evaluate", @"Error in string coercion", nil);
        } else {
            resolve(result);
        }
    }
}

@end
