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
static NSString * const retrieveParticipantsInfoAction = @"org.jitsi.meet.RETRIEVE_PARTICIPANTS_INFO";
static NSString * const openChatAction = @"org.jitsi.meet.OPEN_CHAT";
static NSString * const closeChatAction = @"org.jitsi.meet.CLOSE_CHAT";
static NSString * const sendChatMessageAction = @"org.jitsi.meet.SEND_CHAT_MESSAGE";
static NSString * const setVideoMutedAction = @"org.jitsi.meet.SET_VIDEO_MUTED";

@implementation ExternalAPI

static NSMapTable<NSString*, void (^)(NSArray* participantsInfo)> *participantInfoCompletionHandlers;

__attribute__((constructor))
static void initializeViewsMap() {
    participantInfoCompletionHandlers = [NSMapTable strongToStrongObjectsMapTable];
}

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport {
    return @{
        @"HANG_UP": hangUpAction,
        @"SET_AUDIO_MUTED" : setAudioMutedAction,
        @"SEND_ENDPOINT_TEXT_MESSAGE": sendEndpointTextMessageAction,
        @"TOGGLE_SCREEN_SHARE": toggleScreenShareAction,
        @"RETRIEVE_PARTICIPANTS_INFO": retrieveParticipantsInfoAction,
        @"OPEN_CHAT": openChatAction,
        @"CLOSE_CHAT": closeChatAction,
        @"SEND_CHAT_MESSAGE": sendChatMessageAction,
        @"SET_VIDEO_MUTED" : setVideoMutedAction
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
    return @[ hangUpAction,
              setAudioMutedAction,
              sendEndpointTextMessageAction,
              toggleScreenShareAction,
              retrieveParticipantsInfoAction,
              openChatAction,
              closeChatAction,
              sendChatMessageAction,
              setVideoMutedAction
    ];
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
    
    if ([name isEqual: @"PARTICIPANTS_INFO_RETRIEVED"]) {
        [self onParticipantsInfoRetrieved: data];
        return;
    }

    SEL sel = NSSelectorFromString([self methodNameFromEventName:name]);

    if (sel && [delegate respondsToSelector:sel]) {
        [delegate performSelector:sel withObject:data];
    }
}

- (void) onParticipantsInfoRetrieved:(NSDictionary *)data {
    NSArray *participantsInfoArray = [data objectForKey:@"participantsInfo"];
    NSString *completionHandlerId = [data objectForKey:@"requestId"];
    
    void (^completionHandler)(NSArray*) = [participantInfoCompletionHandlers objectForKey:completionHandlerId];
    completionHandler(participantsInfoArray);
    [participantInfoCompletionHandlers removeObjectForKey:completionHandlerId];
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

- (void)sendEndpointTextMessage:(NSString*)message :(NSString*)to {
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    data[@"to"] = to;
    data[@"message"] = message;
    
    [self sendEventWithName:sendEndpointTextMessageAction body:data];
}

- (void)toggleScreenShare {
    [self sendEventWithName:toggleScreenShareAction body:nil];
}

- (void)retrieveParticipantsInfo:(void (^)(NSArray*))completionHandler {
    NSString *completionHandlerId = [[NSUUID UUID] UUIDString];
    NSDictionary *data = @{ @"requestId": completionHandlerId};
    
    [participantInfoCompletionHandlers setObject:[completionHandler copy] forKey:completionHandlerId];
    
    [self sendEventWithName:retrieveParticipantsInfoAction body:data];
}

- (void)openChat:(NSString*)to {
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    data[@"to"] = to;
    
    [self sendEventWithName:openChatAction body:data];
}

- (void)closeChat {
    [self sendEventWithName:closeChatAction body:nil];
}

- (void)sendChatMessage:(NSString*)message :(NSString*)to {
    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    data[@"to"] = to;
    data[@"message"] = message;
    
    [self sendEventWithName:sendChatMessageAction body:data];
}

- (void)sendSetVideoMuted:(BOOL)muted {
    NSDictionary *data = @{ @"muted": [NSNumber numberWithBool:muted]};

    [self sendEventWithName:setVideoMutedAction body:data];
}


@end
