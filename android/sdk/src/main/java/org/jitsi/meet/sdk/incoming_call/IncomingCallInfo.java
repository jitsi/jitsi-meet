/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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

package org.jitsi.meet.sdk.incoming_call;

import androidx.annotation.NonNull;

public class IncomingCallInfo {
    /**
     * URL for the caller avatar.
     */
    private final String callerAvatarURL;

    /**
     * Caller's name.
     */
    private final String callerName;

    /**
     * Whether this is a regular call or a video call.
     */
    private final boolean hasVideo;

    public IncomingCallInfo(
            @NonNull String callerName,
            @NonNull String callerAvatarURL,
            boolean hasVideo) {
        this.callerName = callerName;
        this.callerAvatarURL = callerAvatarURL;
        this.hasVideo = hasVideo;
    }

    /**
     * Gets the caller's avatar URL.
     * 
     * @return - The URL as a string.
     */
    public String getCallerAvatarURL() {
        return callerAvatarURL;
    }

    /**
     * Gets the caller's name.
     *
     * @return - The caller's name.
     */
    public String getCallerName() {
        return callerName;
    }

    /**
     * Gets whether the call is a video call or not.
     *
     * @return - {@code true} if this call has video; {@code false}, otherwise.
     */
    public boolean hasVideo() {
        return hasVideo;
    }
}
