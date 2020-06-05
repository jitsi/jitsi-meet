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

@protocol JitsiMeetViewDelegate <NSObject>

@optional

/**
 * Called when a conference was joined.
 *
 * The `data` dictionary contains a `url` key with the conference URL.
 */
- (void)conferenceJoined:(NSDictionary *)data;

/**
 * Called when the active conference ends, be it because of user choice or
 * because of a failure.
 *
 * The `data` dictionary contains an `error` key with the error and a `url` key
 * with the conference URL. If the conference finished gracefully no `error`
 * key will be present. The possible values for "error" are described here:
 * https://github.com/jitsi/lib-jitsi-meet/blob/master/JitsiConnectionErrors.js
 * https://github.com/jitsi/lib-jitsi-meet/blob/master/JitsiConferenceErrors.js
 */
- (void)conferenceTerminated:(NSDictionary *)data;

/**
 * Called before a conference is joined.
 *
 * The `data` dictionary contains a `url` key with the conference URL.
 */
- (void)conferenceWillJoin:(NSDictionary *)data;

/**
 * Called when entering Picture-in-Picture is requested by the user. The app
 * should now activate its Picture-in-Picture implementation (and resize the
 * associated `JitsiMeetView`. The latter will automatically detect its new size
 * and adjust its user interface to a variant appropriate for the small size
 * ordinarily associated with Picture-in-Picture.)
 *
 * The `data` dictionary is empty.
 */
- (void)enterPictureInPicture:(NSDictionary *)data;

/**
 * Called when someone else joins the conference
 *
 * The `data` dictionary contains:
 *    `id`: id of the new user as String
 *    `participants`: number of participants in conference, including the 
 *                    new participant.
 *                    NOTE: If you are just initiating the call, you may
 *                    not have joined yourself, so this number is 1 in case
 *                    you are still initiating the call - wait for 
 *                    `conferenceJoined` above...
 */
- (void)participantJoined:(NSDictionary *)data;

/**
 * Called when a participant has left or was kicked out of the conference, 
 * respectively
 *
 * The `data` dictionary contains:
 *    `id`: id of the participant who left
 *    `participants`: number of participants *after* the participant left
 *                    or was kciked out, respectively
 */
- (void)participantLeft:(NSDictionary *)data;
- (void)participantKicked:(NSDictionary *)data;
@end
