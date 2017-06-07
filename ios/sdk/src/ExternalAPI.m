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

#import "JitsiMeetView.h"


@interface ExternalAPI : NSObject<RCTBridgeModule>
@end

@implementation ExternalAPI

RCT_EXPORT_MODULE();

/**
 * Dispatches an event that occurred on JavaScript to the view's delegate.
 *
 * - name: name of the event.
 * - data: dictionary (JSON object in JS) with data associated with the event.
 */
RCT_EXPORT_METHOD(sendEvent:(NSString*)name data:(NSDictionary *) data) {
    JitsiMeetView *view = [JitsiMeetView getInstance];
    id delegate = view != nil ? view.delegate : nil;

    if (delegate == nil) {
        return;
    }

    if ([name isEqualToString:@"CONFERENCE_FAILED"] &&
        [delegate respondsToSelector:@selector(conferenceFailed:)]) {

        [delegate conferenceFailed:data];
    } else if ([name isEqualToString:@"CONFERENCE_JOINED"] &&
               [delegate respondsToSelector:@selector(conferenceJoined:)]) {

        [delegate conferenceJoined:data];
    } else if ([name isEqualToString:@"CONFERENCE_LEFT"] &&
               [delegate respondsToSelector:@selector(conferenceLeft:)]) {

        [delegate conferenceLeft:data];
    } else if ([name isEqualToString:@"CONFERENCE_WILL_JOIN"] &&
               [delegate respondsToSelector:@selector(conferenceWillJoin:)]) {

        [delegate conferenceWillJoin:data];
    } else if ([name isEqualToString:@"CONFERENCE_WILL_LEAVE"] &&
               [delegate respondsToSelector:@selector(conferenceWillLeave:)]) {

        [delegate conferenceWillLeave:data];
    }
}

@end
