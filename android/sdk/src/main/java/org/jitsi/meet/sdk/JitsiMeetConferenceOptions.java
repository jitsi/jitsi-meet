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


/**
 * This class represents the options when joining a Jitsi Meet conference. The user can create an
 * instance by using {@link JitsiMeetConferenceOptions.Builder} and setting the desired options
 * there.
 *
 * The resulting {@link JitsiMeetConferenceOptions} object is immutable and represents how the
 * conference will be joined.
 */
public class JitsiMeetConferenceOptions {
    /**
     * Server where the conference should take place.
     */
    private URL serverURL;
    /**
     * Room name.
     */
    private String room;
    /**
     * JWT token used for authentication.
     */
    private String token;

    /**
     * Color scheme override, see: https://github.com/jitsi/jitsi-meet/blob/dbedee5e22e5dcf9c92db96ef5bb3c9982fc526d/react/features/base/color-scheme/defaultScheme.js
     */
    private Bundle colorScheme;

    /**
     * Set to {@code true} to join the conference with audio / video muted or to start in audio
     * only mode respectively.
     */
    private Boolean audioMuted;
    private Boolean audioOnly;
    private Boolean videoMuted;

    /**
     * Set to {@code true} to enable the welcome page. Typically SDK users won't need this enabled
     * since the host application decides which meeting to join.
     */
    private Boolean welcomePageEnabled;

    /**
     * Class used to build the immutable {@link JitsiMeetConferenceOptions} object.
     */
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

        /**\
         * Sets the server URL.
         * @param url - {@link URL} of the server where the conference should take place.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setServerURL(URL url) {
            this.serverURL = url;

            return this;
        }

        /**
         * Sets the room where the conference will take place.
         * @param room - Name of the room.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setRoom(String room) {
            this.room = room;

            return this;
        }

        /**
         * Sets the JWT token to be used for authentication when joining a conference.
         * @param token - The JWT token to be used for authentication.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setToken(String token) {
            this.token = token;

            return this;
        }

        /**
         * Sets the color scheme override so the app is themed. See:
         * https://github.com/jitsi/jitsi-meet/blob/master/react/features/base/color-scheme/defaultScheme.js
         * for the structure.
         * @param colorScheme - A color scheme to be applied to the app.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setColorScheme(Bundle colorScheme) {
            this.colorScheme = colorScheme;

            return this;
        }

        /**
         * Indicates the conference will be joined with the microphone muted.
         * @param muted - Muted indication.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setAudioMuted(boolean muted) {
            this.audioMuted = muted;

            return this;
        }

        /**
         * Indicates the conference will be joined in audio-only mode. In this mode no video is
         * sent or received.
         * @param audioOnly - Audio-mode indicator.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setAudioOnly(boolean audioOnly) {
            this.audioOnly = audioOnly;

            return this;
        }
        /**
         * Indicates the conference will be joined with the camera muted.
         * @param videoMuted - Muted indication.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setVideoMuted(boolean videoMuted) {
            this.videoMuted = videoMuted;

            return this;
        }

        /**
         * Sets the welcome page enabled / disabled. The welcome page lists recent meetings and
         * calendar appointments and it's meant to be used by standalone applications. Defaults to
         * false.
         * @param enabled - Whether the welcome page should be enabled or not.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setWelcomePageEnabled(boolean enabled) {
            this.welcomePageEnabled = enabled;

            return this;
        }

        /**
         * Builds the immutable {@link JitsiMeetConferenceOptions} object with the configuration
         * that this {@link Builder} instance specified.
         * @return - The built {@link JitsiMeetConferenceOptions} object.
         */
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
