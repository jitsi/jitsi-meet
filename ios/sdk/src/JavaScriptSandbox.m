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

RCT_EXPORT_METHOD(createRuntime:(NSString *)name
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    @try {
        int64_t runtimeId = hermes_sandbox_create_runtime([name UTF8String]);
        
        if (runtimeId != 0) {
            resolve(@(runtimeId));
        } else {
            reject(@"CREATE_RUNTIME_ERROR", @"Failed to create runtime", nil);
        }
        
    } @catch (NSException *exception) {
        reject(@"CREATE_RUNTIME_ERROR", [exception reason], nil);
    }
}

RCT_EXPORT_METHOD(evaluateInRuntime:(nonnull NSNumber *)runtimeId
                  code:(NSString *)code
                  sourceURL:(NSString *)sourceURL
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    @try {
        int64_t rtId = [runtimeId longLongValue];
        
        if (!hermes_sandbox_has_runtime(rtId)) {
            reject(@"INVALID_RUNTIME", [NSString stringWithFormat:@"Runtime does not exist: %lld", rtId], nil);
            return;
        }
        
        const char* resultStr = hermes_sandbox_evaluate_javascript(rtId, [code UTF8String], [sourceURL UTF8String]);
        
        if (resultStr) {
            NSString *result = [NSString stringWithUTF8String:resultStr];
            resolve(result);
        } else {
            reject(@"EVALUATE_ERROR", @"Failed to evaluate JavaScript", nil);
        }
        
    } @catch (NSException *exception) {
        reject(@"EVALUATE_ERROR", [exception reason], nil);
    }
}

RCT_EXPORT_METHOD(evaluate:(NSString *)code
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    int64_t runtimeId = 0;
    
    @try {
        runtimeId = hermes_sandbox_create_runtime("temp_runtime");
        
        if (runtimeId == 0) {
            reject(@"CREATE_RUNTIME_ERROR", @"Failed to create temporary runtime", nil);
            return;
        }
        
        const char* resultStr = hermes_sandbox_evaluate_javascript(runtimeId, [code UTF8String], "temp_evaluation");
        
        if (resultStr) {
            NSString *result = [NSString stringWithUTF8String:resultStr];
            resolve(result);
        } else {
            reject(@"EVALUATE_ERROR", @"Failed to evaluate JavaScript", nil);
        }
        
    } @catch (NSException *exception) {
        reject(@"EVALUATE_ERROR", [exception reason], nil);
    } @finally {
        if (runtimeId != 0) {
            hermes_sandbox_delete_runtime(runtimeId);
        }
    }
}

RCT_EXPORT_METHOD(deleteRuntime:(nonnull NSNumber *)runtimeId
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    @try {
        int64_t rtId = [runtimeId longLongValue];
        bool success = hermes_sandbox_delete_runtime(rtId);
        resolve(@(success));
        
    } @catch (NSException *exception) {
        reject(@"DELETE_RUNTIME_ERROR", [exception reason], nil);
    }
}

RCT_EXPORT_METHOD(hasRuntime:(nonnull NSNumber *)runtimeId
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    @try {
        int64_t rtId = [runtimeId longLongValue];
        bool exists = hermes_sandbox_has_runtime(rtId);
        resolve(@(exists));
        
    } @catch (NSException *exception) {
        reject(@"HAS_RUNTIME_ERROR", [exception reason], nil);
    }
}

RCT_EXPORT_METHOD(getRuntimeName:(nonnull NSNumber *)runtimeId
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    @try {
        int64_t rtId = [runtimeId longLongValue];
        const char* nameStr = hermes_sandbox_get_runtime_name(rtId);
        
        if (nameStr) {
            NSString *name = [NSString stringWithUTF8String:nameStr];
            resolve(name);
        } else {
            resolve([NSNull null]);
        }
        
    } @catch (NSException *exception) {
        reject(@"GET_RUNTIME_NAME_ERROR", [exception reason], nil);
    }
}

RCT_EXPORT_METHOD(getRuntimeCount:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject) {
    
    @try {
        int count = hermes_sandbox_get_runtime_count();
        resolve(@(count));
        
    } @catch (NSException *exception) {
        reject(@"GET_RUNTIME_COUNT_ERROR", [exception reason], nil);
    }
}

@end
