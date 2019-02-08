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

package org.jitsi.meet.sdk;

import android.os.Bundle;

import java.net.URL;


public class JitsiMeetConferenceOptions {
    private URL serverURL;
    private String room;
    private String token;

    private Bundle colorScheme;

    private Boolean audioMuted;
    private Boolean audioOnly;
    private Boolean videoMuted;

    private Boolean welcomePageEnabled;

    public static class Builder {
        private URL serverURL;
        private String room;
        private String token;

        private Bundle colorScheme;

        private Boolean audioMuted;
        private Boolean audioOnly;
        private Boolean videoMuted;

        private Boolean welcomePageEnabled;

        public Builder() {
        }

        public Builder setServerURL(URL url) {
            this.serverURL = url;

            return this;
        }

        public Builder setRoom(String room) {
            this.room = room;

            return this;
        }

        public Builder setToken(String token) {
            this.token = token;

            return this;
        }

        public Builder setColorScheme(Bundle colorScheme) {
            this.colorScheme = colorScheme;

            return this;
        }

        public Builder setAudioMuted(boolean muted) {
            this.audioMuted = muted;

            return this;
        }

        public Builder setAudioOnly(boolean audioOnly) {
            this.audioOnly = audioOnly;

            return this;
        }

        public Builder setVideoMuted(boolean videoMuted) {
            this.videoMuted = videoMuted;

            return this;
        }

        public Builder setWelcomePageEnabled(boolean enabled) {
            this.welcomePageEnabled = enabled;

            return this;
        }

        public JitsiMeetConferenceOptions build() {
            JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions();

            options.serverURL = this.serverURL;
            options.room = this.room;
            options.token = this.token;
            options.colorScheme = this.colorScheme;
            options.audioMuted = this.audioMuted;
            options.audioOnly = this.audioOnly;
            options.videoMuted = this.videoMuted;
            options.welcomePageEnabled = this.welcomePageEnabled;

            return options;
        }
    }

    private JitsiMeetConferenceOptions() {
    }

    Bundle asProps() {
        Bundle props = new Bundle();

        if (colorScheme != null) {
            props.putBundle("colorScheme", colorScheme);
        }

        if (welcomePageEnabled != null) {
            props.putBoolean("welcomePageEnabled", welcomePageEnabled);
        }

        // TODO: get rid of this.
        props.putBoolean("pictureInPictureEnabled", true);

        Bundle config = new Bundle();

        if (audioMuted != null) {
            config.putBoolean("startWithAudioMuted", audioMuted);
        }
        if (audioOnly != null) {
            config.putBoolean("startAudioOnly", audioOnly);
        }
        if (videoMuted != null) {
            config.putBoolean("startWithVideoMuted", videoMuted);
        }

        Bundle urlProps = new Bundle();

        // The room is fully qualified
        if (room != null && room.contains("://")) {
            urlProps.putString("url", room);
        } else {
            if (serverURL != null) {
                urlProps.putString("serverURL", serverURL.toString());
            }
            if (room != null) {
                urlProps.putString("room", room);
            }
        }

        if (token != null) {
            urlProps.putString("jwt", token);
        }

        urlProps.putBundle("config", config);
        props.putBundle("url", urlProps);

        return props;
    }
}
