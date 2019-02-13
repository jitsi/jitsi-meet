/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
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

package org.jitsi.meet;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.JitsiMeetViewListener;

import com.crashlytics.android.Crashlytics;
import com.facebook.react.bridge.UiThreadUtil;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import io.fabric.sdk.android.Fabric;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

/**
 * The one and only {@link Activity} that the Jitsi Meet app needs. The
 * {@code Activity} is launched in {@code singleTask} mode, so it will be
 * created upon application initialization and there will be a single instance
 * of it. Further attempts at launching the application once it was already
 * launched will result in {@link Activity#onNewIntent(Intent)} being called.
 *
 * This {@code Activity} extends {@link JitsiMeetActivity} to keep the React
 * Native CLI working, since the latter always tries to launch an
 * {@code Activity} named {@code MainActivity} when doing
 * {@code react-native run-android}.
 */
public class MainActivity extends JitsiMeetActivity {

    @Override
    protected JitsiMeetView initializeView() {
        JitsiMeetView view = super.initializeView();

        // XXX In order to increase (1) awareness of API breakages and (2) API
        // coverage, utilize JitsiMeetViewListener in the Debug configuration of
        // the app.
        if (BuildConfig.DEBUG && view != null) {
            view.setListener(new JitsiMeetViewListener() {
                private void on(String name, Map<String, Object> data) {
                    UiThreadUtil.assertOnUiThread();

                    // Log with the tag "ReactNative" in order to have the log
                    // visible in react-native log-android as well.
                    Log.d(
                        "ReactNative",
                        JitsiMeetViewListener.class.getSimpleName() + " "
                            + name + " "
                            + data);
                }

                @Override
                public void onConferenceFailed(Map<String, Object> data) {
                    on("CONFERENCE_FAILED", data);
                }

                @Override
                public void onConferenceJoined(Map<String, Object> data) {
                    on("CONFERENCE_JOINED", data);
                }

                @Override
                public void onConferenceLeft(Map<String, Object> data) {
                    on("CONFERENCE_LEFT", data);
                }

                @Override
                public void onConferenceWillJoin(Map<String, Object> data) {
                    on("CONFERENCE_WILL_JOIN", data);
                }

                @Override
                public void onConferenceWillLeave(Map<String, Object> data) {
                    on("CONFERENCE_WILL_LEAVE", data);
                }

                @Override
                public void onLoadConfigError(Map<String, Object> data) {
                    on("LOAD_CONFIG_ERROR", data);
                }
            });

        }

        return view;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // As this is the Jitsi Meet app (i.e. not the Jitsi Meet SDK), we do
        // want to enable some options.

        // The welcome page defaults to disabled in the SDK at the time of this
        // writing but it is clearer to be explicit about what we want anyway.
        setWelcomePageEnabled(true);

        super.onCreate(savedInstanceState);

        // Setup Crashlytics and Firebase Dynamic Links
        if (BuildConfig.GOOGLE_SERVICES_ENABLED) {
            Fabric.with(this, new Crashlytics());

            FirebaseDynamicLinks.getInstance().getDynamicLink(getIntent())
                .addOnSuccessListener(this, pendingDynamicLinkData -> {
                    Uri dynamicLink = null;

                    if (pendingDynamicLinkData != null) {
                        dynamicLink = pendingDynamicLinkData.getLink();
                    }

                    if (dynamicLink != null) {
                        try {
                            loadURL(new URL(dynamicLink.toString()));
                        } catch (MalformedURLException e) {
                            Log.d("ReactNative", "Malformed dynamic link", e);
                        }
                    }
                });
        }
    }

}
