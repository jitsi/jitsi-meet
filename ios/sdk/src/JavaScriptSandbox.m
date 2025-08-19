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

#import <React/RCTBridgeModule.h>
#include <hermes_sandbox.h>

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
    
    int64_t runtimeId = 0;
    const char* resultStr = NULL;
    
    @try {
        runtimeId = hermes_sandbox_create_runtime();
        resultStr = hermes_sandbox_evaluate_javascript(runtimeId, [code UTF8String]);
        
        if (resultStr) {
            NSString *result = [NSString stringWithUTF8String:resultStr];
            free((void*)resultStr);
            resolve(result);
        } else {
            reject(@"evaluate", @"Failed to evaluate JavaScript", nil);
        }
        
    } @catch (NSException *exception) {
        reject(@"evaluate", [exception reason], nil);
    } @finally {
        if (runtimeId != 0) {
            hermes_sandbox_delete_runtime(runtimeId);
        }
    }
}

@end
