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
     * Called when joining a conference fails or an ongoing conference is
     * interrupted due to a failure.
     *
     * @param data - Map with an "error" key describing the problem, and
     * a "url" key with the conference URL.
     */
    void onConferenceFailed(Map<String, Object> data);

    /**
     * Called when a conference was joined.
     *
     * @param data - Map with a "url" key with the conference URL.
     */
    void onConferenceJoined(Map<String, Object> data);

    /**
     * Called when the conference was left, typically after hanging up.
     *
     * @param data - Map with a "url" key with the conference URL.
     */
    void onConferenceLeft(Map<String, Object> data);

    /**
     * Called before the conference is joined.
     *
     * @param data - Map with a "url" key with the conference URL.
     */
    void onConferenceWillJoin(Map<String, Object> data);

    /**
     * Called before the conference is left.
     *
     * @param data - Map with a "url" key with the conference URL.
     */
    void onConferenceWillLeave(Map<String, Object> data);
}
