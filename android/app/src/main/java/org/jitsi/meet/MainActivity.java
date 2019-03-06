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
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.support.v4.app.FragmentActivity;
import android.view.KeyEvent;

import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivityInterface;
import org.jitsi.meet.sdk.JitsiMeetActivityDelegate;
import org.jitsi.meet.sdk.JitsiMeetFragment;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;

import com.crashlytics.android.Crashlytics;
import com.facebook.react.modules.core.PermissionListener;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import io.fabric.sdk.android.Fabric;

import java.net.MalformedURLException;
import java.net.URL;

/**
 * The one and only {@link FragmentActivity} that the Jitsi Meet app needs. The
 * {@code Activity} is launched in {@code singleTask} mode, so it will be
 * created upon application initialization and there will be a single instance
 * of it. Further attempts at launching the application once it was already
 * launched will result in {@link FragmentActivity#onNewIntent(Intent)} being called.
 */
public class MainActivity extends FragmentActivity implements JitsiMeetActivityInterface {
    /**
     * The request code identifying requests for the permission to draw on top
     * of other apps. The value must be 16-bit and is arbitrarily chosen here.
     */
    private static final int OVERLAY_PERMISSION_REQUEST_CODE
        = (int) (Math.random() * Short.MAX_VALUE);

    private static final String TAG = "MainActivity";

    private JitsiMeetFragment getFragment() {
        return (JitsiMeetFragment) getSupportFragmentManager().findFragmentById(R.id.jitsiFragment);
    }

    private @Nullable URL buildURL(String urlStr) {
        try {
            return new URL(urlStr);
        } catch (MalformedURLException e) {
            return null;
        }
    }

    private void initialize() {
        // Set default options
        JitsiMeetConferenceOptions defaultOptions
            = new JitsiMeetConferenceOptions.Builder()
                .setWelcomePageEnabled(true)
                .setServerURL(buildURL("https://meet.jit.si"))
                .build();
        JitsiMeet.setDefaultConferenceOptions(defaultOptions);

        // Join the room specified by the URL the app was launched with.
        // Joining without the room option displays the welcome page.
        join(getIntentUrl(getIntent()));
    }

    private void join(@Nullable String url) {
        JitsiMeetConferenceOptions options
            = new JitsiMeetConferenceOptions.Builder()
                .setRoom(url)
                .build();
        getFragment().getJitsiView().join(options);
    }

    private @Nullable String getIntentUrl(Intent intent) {
        Uri uri;

        if (Intent.ACTION_VIEW.equals(intent.getAction())
                && (uri = intent.getData()) != null) {
            return uri.toString();
        }

        return null;
    }

    private boolean canRequestOverlayPermission() {
        return
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && getApplicationInfo().targetSdkVersion >= Build.VERSION_CODES.M;
    }

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

    @Override
    public void onBackPressed() {
        JitsiMeetActivityDelegate.onBackPressed();
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

    @Override
    public void onNewIntent(Intent intent) {
        String url;

        if ((url = getIntentUrl(intent)) != null) {
            join(url);
            return;
        }

        JitsiMeetActivityDelegate.onNewIntent(intent);
    }

    @Override
    protected void onUserLeaveHint() {
        getFragment().getJitsiView().enterPictureInPicture();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Set the Activity's content view.
        setContentView(R.layout.main_layout);

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
                return;
            }
        }

        initialize();
    }

    @Override
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        JitsiMeetActivityDelegate.requestPermissions(this, permissions, requestCode, listener);
    }

}
