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

#import "RCTBridgeModule.h"

#import "JitsiMeetView+Private.h"

@interface ExternalAPI : NSObject<RCTBridgeModule>

@end

@implementation ExternalAPI

RCT_EXPORT_MODULE();

/**
 * Dispatches an event that occurred on JavaScript to the view's delegate.
 *
 * @param name The name of the event.
 * @param data The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
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

    if ([name isEqualToString:@"CONFERENCE_FAILED"]
            && [delegate respondsToSelector:@selector(conferenceFailed:)]) {
        [delegate conferenceFailed:data];

    } else if ([name isEqualToString:@"CONFERENCE_JOINED"]
            && [delegate respondsToSelector:@selector(conferenceJoined:)]) {
        [delegate conferenceJoined:data];

    } else if ([name isEqualToString:@"CONFERENCE_LEFT"]
            && [delegate respondsToSelector:@selector(conferenceLeft:)]) {
        [delegate conferenceLeft:data];

    } else if ([name isEqualToString:@"CONFERENCE_WILL_JOIN"]
            && [delegate respondsToSelector:@selector(conferenceWillJoin:)]) {
        [delegate conferenceWillJoin:data];

    } else if ([name isEqualToString:@"CONFERENCE_WILL_LEAVE"]
            && [delegate respondsToSelector:@selector(conferenceWillLeave:)]) {
        [delegate conferenceWillLeave:data];
    }
}

@end
