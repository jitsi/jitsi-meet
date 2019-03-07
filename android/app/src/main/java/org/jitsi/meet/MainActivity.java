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

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.KeyEvent;

import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;

import com.crashlytics.android.Crashlytics;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import io.fabric.sdk.android.Fabric;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

/**
 * The one and only Activity that the Jitsi Meet app needs. The
 * {@code Activity} is launched in {@code singleTask} mode, so it will be
 * created upon application initialization and there will be a single instance
 * of it. Further attempts at launching the application once it was already
 * launched will result in {@link MainActivity#onNewIntent(Intent)} being called.
 */
public class MainActivity extends JitsiMeetActivity {
    /**
     * The request code identifying requests for the permission to draw on top
     * of other apps. The value must be 16-bit and is arbitrarily chosen here.
     */
    private static final int OVERLAY_PERMISSION_REQUEST_CODE
        = (int) (Math.random() * Short.MAX_VALUE);

    // JitsiMeetActivity overrides
    //

    @Override
    protected boolean extraInitialize() {
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
                        join(dynamicLink.toString());
                    }
                });
        }

        // In Debug builds React needs permission to write over other apps in
        // order to display the warning and error overlays.
        if (BuildConfig.DEBUG) {
            if (canRequestOverlayPermission() && !Settings.canDrawOverlays(this)) {
                Intent intent
                    = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));

                startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);

                return true;
            }
        }

        return false;
    }

    @Override
    protected void initialize() {
        // Set default options
        JitsiMeetConferenceOptions defaultOptions
            = new JitsiMeetConferenceOptions.Builder()
                .setWelcomePageEnabled(true)
                .setServerURL(buildURL("https://meet.jit.si"))
                .build();
        JitsiMeet.setDefaultConferenceOptions(defaultOptions);

        super.initialize();
    }

    @Override
    public void onConferenceFailed(Map<String, Object> data) {
        Log.d(TAG, "Conference failed: " + data);
    }

    @Override
    public void onConferenceLeft(Map<String, Object> data) {
        Log.d(TAG, "Conference left: " + data);
    }

    @Override
    public void onLoadConfigError(Map<String, Object> data) {
        Log.d(TAG, "Error loading config: " + data);
    }

    // Activity lifecycle method overrides
    //

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE
                && canRequestOverlayPermission()) {
            if (Settings.canDrawOverlays(this)) {
                initialize();
            }

            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    // ReactAndroid/src/main/java/com/facebook/react/ReactActivity.java
    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (BuildConfig.DEBUG && keyCode == KeyEvent.KEYCODE_MENU) {
            JitsiMeet.showDevOptions();
            return true;
        }

        return super.onKeyUp(keyCode, event);
    }

    // Helper methods
    //

    private @Nullable URL buildURL(String urlStr) {
        try {
            return new URL(urlStr);
        } catch (MalformedURLException e) {
            return null;
        }
    }

    private boolean canRequestOverlayPermission() {
        return
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && getApplicationInfo().targetSdkVersion >= Build.VERSION_CODES.M;
    }
}
