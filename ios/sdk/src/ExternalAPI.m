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

#import <React/RCTBridgeModule.h>

#import "JitsiMeetView+Private.h"

@interface ExternalAPI : NSObject<RCTBridgeModule>
@end

@implementation ExternalAPI

RCT_EXPORT_MODULE();

/**
 * Make sure all methods in this module are invoked on the main/UI thread.
 */
- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

/**
 * Dispatches an event that occurred on JavaScript to the view's delegate.
 *
 * @param name The name of the event.
 * @param data The details/specifics of the event to send determined
 * by/associated with the specified `name`.
 * @param scope
 */
RCT_EXPORT_METHOD(sendEvent:(NSString *)name
                       data:(NSDictionary *)data
                      scope:(NSString *)scope) {
    // The JavaScript App needs to provide uniquely identifying information to
    // the native ExternalAPI module so that the latter may match the former
    // to the native JitsiMeetView which hosts it.
    JitsiMeetView *view = [JitsiMeetView viewForExternalAPIScope:scope];

    if (!view) {
        return;
    }

    id delegate = view.delegate;

    if (!delegate) {
        return;
    }

    SEL sel = NSSelectorFromString([self methodNameFromEventName:name]);

    if (sel && [delegate respondsToSelector:sel]) {
        [delegate performSelector:sel withObject:data];
    }
}

/**
 * Converts a specific event name i.e. redux action type description to a
 * method name.
 *
 * @param eventName The event name to convert to a method name.
 * @return A method name constructed from the specified `eventName`.
 */
- (NSString *)methodNameFromEventName:(NSString *)eventName {
   NSMutableString *methodName
       = [NSMutableString stringWithCapacity:eventName.length];

   for (NSString *c in [eventName componentsSeparatedByString:@"_"]) {
       if (c.length) {
           [methodName appendString:
               methodName.length ? c.capitalizedString : c.lowercaseString];
       }
   }
   [methodName appendString:@":"];

   return methodName;
}

@end
