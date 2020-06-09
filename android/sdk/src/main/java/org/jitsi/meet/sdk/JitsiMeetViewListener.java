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

package org.jitsi.meet.sdk;

import java.util.Map;

/**
 * Interface for listening to events coming from Jitsi Meet.
 */
public interface JitsiMeetViewListener {
    /**
     * Called when a conference was joined.
     *
     * @param data Map with a "url" key with the conference URL.
     */
    void onConferenceJoined(Map<String, Object> data);

    /**
     * Called when the active conference ends, be it because of user choice or
     * because of a failure.
     *
     * @param data Map with an "error" key with the error and a "url" key with
     * the conference URL. If the conference finished gracefully no `error`
     * key will be present. The possible values for "error" are described here:
     * https://github.com/jitsi/lib-jitsi-meet/blob/master/JitsiConnectionErrors.js
     * https://github.com/jitsi/lib-jitsi-meet/blob/master/JitsiConferenceErrors.js
     */
    void onConferenceTerminated(Map<String, Object> data);

    /**
     * Called before the conference is joined.
     *
     * @param data Map with a "url" key with the conference URL.
     */
    void onConferenceWillJoin(Map<String, Object> data);

    /**
     * Called when someone else joins the conference
     *
     * @param data Map containing:
     *    "participant": A JSON structure describing the participant
     *      "id": id of the new particpant
     *      "name": name of the new participant
     *      "email": email of the new participant (if any)
     *      "role": role of the participant (participant | moderator)
     *      "avatarURL": avatarURL of the participant, if any
     *
     *      NOTE: Except for "id", not all fields are always available.
     *      If e.g. no "email" was set, that field will not show up at all.
     *
     *    "numParticipants": number of participants in conference, including the
     *                       new participant.
     *
     *  NOTE: If you are just initiating the call, you may
     *        not have joined yourself, so this number is 1 in case
     *        you are still initiating the call - wait for
     *        "onConferenceJoined" above...
     */
    void onParticipantJoined(Map<String, Object> data);

    /**
     * Called when a participant (not you) leaves the conference
     *
     * @param data Map containing:
     *    "participant": A JSON structure describing the participant
     *      "id": id of the new particpant
     *      "name": name of the new participant
     *      "email": email of the new participant (if any)
     *      "role": role of the participant (participant | moderator)
     *      "avatarURL": avatarURL of the participant, if any
     *
     *      NOTE: Except for "id", not all fields are always available.
     *      If e.g. no "email" was set, that field will not show up at all.
     *
     *    "numParticipants": number of participants in conference, after the
     *                       participant left
     *
     *    NOTE: If "numParticipants" is 1, that means that you are the only
     *    participant left in the call.
     */
    void onParticipantLeft(Map<String, Object> data);

    /**
     * Called when a participant was kicked out of the conference.
     *
     * @param data Map containing:
     *    "id": id of the participant who was kicked out
     *    "numParticipants": number of participants *after* the participant
     *                    was kciked out.
     */
    void onParticipantKicked(Map<String, Object> data);
}
