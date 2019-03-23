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

#import <React/RCTAssert.h>

#import "ReactUtils.h"

#pragma mark - Utility functions

/**
 * Merges 2 sets of props into a single one.
 */
NSMutableDictionary* mergeProps(NSDictionary *a, NSDictionary *b) {
    if (a == nil) {
        return [NSMutableDictionary dictionaryWithDictionary:b == nil ? @{} : b];
    }

    if (b == nil) {
        return [NSMutableDictionary dictionaryWithDictionary:a];
    }

    // Both have values, let's merge them, the strategy is to take the value from a first,
    // then override it with the one from b. If the value is a dictionary, merge them
    // recursively. Same goes for arrays.
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithDictionary:a];

    for (NSString *key in b) {
        id value = b[key];
        id aValue = result[key];

        if (aValue == nil) {
            result[key] = value;
            continue;
        }

        if ([value isKindOfClass:NSArray.class]) {
            result[key] = [aValue arrayByAddingObjectsFromArray:value];
        } else if ([value isKindOfClass:NSDictionary.class]) {
            result[key] = mergeProps(aValue, value);
        } else {
            result[key] = value;
        }
    }

    return result;
}

/**
 * A `RCTFatalHandler` implementation which swallows JavaScript errors. In the
 * Release configuration, React Native will (intentionally) raise an unhandled
 * `NSException` for an unhandled JavaScript error. This will effectively kill
 * the application. `_RCTFatal` is suitable to be in accord with the Web i.e.
 * not kill the application.
 */
RCTFatalHandler _RCTFatal = ^(NSError *error) {
    id jsStackTrace = error.userInfo[RCTJSStackTraceKey];
    @try {
        NSString *name
        = [NSString stringWithFormat:@"%@: %@",
           RCTFatalExceptionName,
           error.localizedDescription];
        NSString *message
        = RCTFormatError(error.localizedDescription, jsStackTrace, 75);
        [NSException raise:name format:@"%@", message];
    } @catch (NSException *e) {
        if (!jsStackTrace) {
            @throw;
        }
    }
};

/**
 * Helper function to register a fatal error handler for React. Our handler
 * won't kill the process, it will swallow JS errors and print stack traces
 * instead.
 */
void registerReactFatalErrorHandler() {
#if !DEBUG
    // In the Release configuration, React Native will (intentionally) raise an
    // unhandled `NSException` for an unhandled JavaScript error. This will
    // effectively kill the application. In accord with the Web, do not kill the
    // application.
    if (!RCTGetFatalHandler()) {
        RCTSetFatalHandler(_RCTFatal);
    }
#endif
}
