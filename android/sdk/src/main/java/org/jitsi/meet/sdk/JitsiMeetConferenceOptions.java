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
import android.os.Parcel;
import android.os.Parcelable;

import java.net.URL;


/**
 * This class represents the options when joining a Jitsi Meet conference. The user can create an
 * instance by using {@link JitsiMeetConferenceOptions.Builder} and setting the desired options
 * there.
 *
 * The resulting {@link JitsiMeetConferenceOptions} object is immutable and represents how the
 * conference will be joined.
 */
public class JitsiMeetConferenceOptions implements Parcelable {
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
     * Config. See: https://github.com/jitsi/jitsi-meet/blob/master/config.js
     */
    private Bundle config;

    /**
     * Feature flags. See: https://github.com/jitsi/jitsi-meet/blob/master/react/features/base/flags/constants.js
     */
    private Bundle featureFlags;

    /**
     * USer information, to be used when no token is specified.
     */
    private JitsiMeetUserInfo userInfo;

    public URL getServerURL() {
        return serverURL;
    }

    public String getRoom() {
        return room;
    }

    public String getToken() {
        return token;
    }

    public Bundle getFeatureFlags() {
        return featureFlags;
    }

    public JitsiMeetUserInfo getUserInfo() {
        return userInfo;
    }

    /**
     * Class used to build the immutable {@link JitsiMeetConferenceOptions} object.
     */
    public static class Builder {
        private URL serverURL;
        private String room;
        private String token;

        private Bundle config;
        private Bundle featureFlags;

        private JitsiMeetUserInfo userInfo;

        public Builder() {
            config = new Bundle();
            featureFlags = new Bundle();
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
         * Sets the conference subject.
         * @param subject - Subject for the conference.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setSubject(String subject) {
            setConfigOverride("subject", subject);

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
         * Indicates the conference will be joined with the microphone muted.
         * @param audioMuted - Muted indication.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setAudioMuted(boolean audioMuted) {
            setConfigOverride("startWithAudioMuted", audioMuted);

            return this;
        }

        /**
         * Indicates the conference will be joined in audio-only mode. In this mode no video is
         * sent or received.
         * @param audioOnly - Audio-mode indicator.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setAudioOnly(boolean audioOnly) {
            setConfigOverride("startAudioOnly", audioOnly);

            return this;
        }
        /**
         * Indicates the conference will be joined with the camera muted.
         * @param videoMuted - Muted indication.
         * @return - The {@link Builder} object itself so the method calls can be chained.
         */
        public Builder setVideoMuted(boolean videoMuted) {
            setConfigOverride("startWithVideoMuted", videoMuted);

            return this;
        }

        public Builder setFeatureFlag(String flag, boolean value) {
            this.featureFlags.putBoolean(flag, value);

            return this;
        }

        public Builder setFeatureFlag(String flag, String value) {
            this.featureFlags.putString(flag, value);

            return this;
        }

        public Builder setFeatureFlag(String flag, int value) {
            this.featureFlags.putInt(flag, value);

            return this;
        }

        public Builder setUserInfo(JitsiMeetUserInfo userInfo) {
            this.userInfo = userInfo;

            return this;
        }

        public Builder setConfigOverride(String config, String value) {
            this.config.putString(config, value);

            return this;
        }

        public Builder setConfigOverride(String config, int value) {
            this.config.putInt(config, value);

            return this;
        }

        public Builder setConfigOverride(String config, boolean value) {
            this.config.putBoolean(config, value);

            return this;
        }

        public Builder setConfigOverride(String config, Bundle bundle) {
            this.config.putBundle(config, bundle);

            return this;
        }

        public Builder setConfigOverride(String config, String[] list) {
            this.config.putStringArray(config, list);

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
            options.config = this.config;
            options.featureFlags = this.featureFlags;
            options.userInfo = this.userInfo;

            return options;
        }
    }

    private JitsiMeetConferenceOptions() {
    }

    private JitsiMeetConferenceOptions(Parcel in) {
        serverURL = (URL) in.readSerializable();
        room = in.readString();
        token = in.readString();
        config = in.readBundle();
        featureFlags = in.readBundle();
        userInfo = new JitsiMeetUserInfo(in.readBundle());
    }

    Bundle asProps() {
        Bundle props = new Bundle();

        // Android always has the PiP flag set by default.
        if (!featureFlags.containsKey("pip.enabled")) {
            featureFlags.putBoolean("pip.enabled", true);
        }

        props.putBundle("flags", featureFlags);

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

        if (userInfo != null) {
            props.putBundle("userInfo", userInfo.asBundle());
        }

        urlProps.putBundle("config", config);
        props.putBundle("url", urlProps);

        return props;
    }

    // Parcelable interface
    //

    public static final Creator<JitsiMeetConferenceOptions> CREATOR = new Creator<JitsiMeetConferenceOptions>() {
        @Override
        public JitsiMeetConferenceOptions createFromParcel(Parcel in) {
            return new JitsiMeetConferenceOptions(in);
        }

        @Override
        public JitsiMeetConferenceOptions[] newArray(int size) {
            return new JitsiMeetConferenceOptions[size];
        }
    };

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeSerializable(serverURL);
        dest.writeString(room);
        dest.writeString(token);
        dest.writeBundle(config);
        dest.writeBundle(featureFlags);
        dest.writeBundle(userInfo != null ? userInfo.asBundle() : new Bundle());
    }

    @Override
    public int describeContents() {
        return 0;
    }
}
