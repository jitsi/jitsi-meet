/*
 * Copyright @ 2017-present 8x8, Inc.
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

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;

import com.facebook.react.ReactInstanceManager;

import org.devio.rn.splashscreen.SplashScreen;
import org.jitsi.meet.sdk.log.JitsiMeetLogger;

public class JitsiMeet {

    /**
     * Default {@link JitsiMeetConferenceOptions} which will be used for all conferences. When
     * joining a conference these options will be merged with the ones passed to
     * {@link JitsiMeetView} join().
     */
    private static JitsiMeetConferenceOptions defaultConferenceOptions;

    public static JitsiMeetConferenceOptions getDefaultConferenceOptions() {
        return defaultConferenceOptions;
    }

    public static void setDefaultConferenceOptions(JitsiMeetConferenceOptions options) {
        if (options != null && options.getRoom() != null) {
            throw new RuntimeException("'room' must be null in the default conference options");
        }
        defaultConferenceOptions = options;
    }

    /**
     * Returns the current conference URL as a string.
     *
     * @return the current conference URL.
     */
    public static String getCurrentConference() {
        return OngoingConferenceTracker.getInstance().getCurrentConference();
    }

    /**
     * Helper to get the default conference options as a {@link Bundle}.
     *
     * @return a {@link Bundle} with the default conference options.
     */
    static Bundle getDefaultProps() {
        if (defaultConferenceOptions != null) {
            return defaultConferenceOptions.asProps();
        }

        return new Bundle();
    }

    /**
     * Used in development mode. It displays the React Native development menu.
     */
    public static void showDevOptions() {
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            reactInstanceManager.showDevOptionsDialog();
        }
    }

    public static boolean isCrashReportingDisabled(Context context) {
        SharedPreferences preferences = context.getSharedPreferences("jitsi-default-preferences", Context.MODE_PRIVATE);
        String value = preferences.getString("isCrashReportingDisabled", "");
        return Boolean.parseBoolean(value);
    }

    /**
     * Helper method to show the SplashScreen.
     *
     * @param activity - The activity on which to show the SplashScreen {@link Activity}.
     */
    public static void showSplashScreen(Activity activity) {
        try {
            SplashScreen.show(activity);
        } catch (Exception e) {
            JitsiMeetLogger.e(e, "Failed to show splash screen");
        }
    }
}