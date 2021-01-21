/*
 * Copyright @ 2017-present 8x8, Inc.
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

#import "ExternalAPI.h"
#import "JitsiMeetView+Private.h"

// Events
static NSString * const hangUpAction = @"org.jitsi.meet.HANG_UP";
static NSString * const setAudioMutedAction = @"org.jitsi.meet.SET_AUDIO_MUTED";
static NSString * const sendEndpointTextMessageAction = @"org.jitsi.meet.SEND_ENDPOINT_TEXT_MESSAGE";
static NSString * const toggleScreenShareAction = @"org.jitsi.meet.TOGGLE_SCREEN_SHARE";

@implementation ExternalAPI

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport {
    return @{
        @"HANG_UP": hangUpAction,
        @"SET_AUDIO_MUTED" : setAudioMutedAction,
        @"SEND_ENDPOINT_TEXT_MESSAGE": sendEndpointTextMessageAction,
        @"TOGGLE_SCREEN_SHARE": toggleScreenShareAction
    };
};

/**
 * Make sure all methods in this module are invoked on the main/UI thread.
 */
- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ hangUpAction, setAudioMutedAction, sendEndpointTextMessageAction, toggleScreenShareAction ];
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

- (void)sendHangUp {
    [self sendEventWithName:hangUpAction body:nil];
}

- (void)sendSetAudioMuted:(BOOL)muted {
    NSDictionary *data = @{ @"muted": [NSNumber numberWithBool:muted]};

    [self sendEventWithName:setAudioMutedAction body:data];
}

- (void)sendEndpointTextMessage:(NSString*)to :(NSString*)message {
    NSDictionary *data = @{
        @"to": to,
        @"message": message
    };
    
    [self sendEventWithName:sendEndpointTextMessageAction body:data];
}

- (void)toggleScreenShare {
    [self sendEventWithName:toggleScreenShareAction body:nil];
}

@end
