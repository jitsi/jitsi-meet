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

import java.net.MalformedURLException;
import java.net.URL;

/**
 * This class represents user information to be passed to {@link JitsiMeetConferenceOptions} for
 * identifying a user.
 */
public class JitsiMeetUserInfo {
    /**
     * User's display name.
     */
    private String displayName;

    /**
     * User's email address.
     */
    private String email;

    /**
     * User's avatar URL.
     */
    private URL avatar;

    public JitsiMeetUserInfo() {}

    public JitsiMeetUserInfo(Bundle b) {
        super();

        if (b.containsKey("displayName")) {
            displayName = b.getString("displayName");
        }

        if (b.containsKey("email")) {
            email = b.getString("email");
        }

        if (b.containsKey("avatarURL")) {
            String avatarURL = b.getString("avatarURL");
            try {
                avatar = new URL(avatarURL);
            } catch (MalformedURLException e) {
            }
        }
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public URL getAvatar() {
        return avatar;
    }

    public void setAvatar(URL avatar) {
        this.avatar = avatar;
    }

    Bundle asBundle() {
        Bundle b = new Bundle();

        if (displayName != null) {
            b.putString("displayName", displayName);
        }

        if (email != null) {
            b.putString("email", email);
        }

        if (avatar != null) {
            b.putString("avatarURL", avatar.toString());
        }

        return b;
    }
}
