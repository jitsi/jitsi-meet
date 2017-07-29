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

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;

import java.net.URL;

/**
 * Base Activity for applications integrating Jitsi Meet at a higher level. It
 * contains all the required wiring between the <tt>JKConferenceView</tt> and
 * the Activity lifecycle methods already implemented.
 *
 * In this activity we use a single <tt>JKConferenceView</tt> instance. This
 * instance gives us access to a view which displays the welcome page and the
 * conference itself. All lifetime methods associated with this Activity are
 * hooked to the React Native subsystem via proxy calls through the
 * <tt>JKConferenceView</tt> static methods.
 */
public class JitsiMeetActivity extends AppCompatActivity {
    /**
     * The request code identifying requests for the permission to draw on top
     * of other apps. The value must be 16-bit and is arbitrarily chosen here. 
     */
    private static final int OVERLAY_PERMISSION_REQUEST_CODE
        = (int) (Math.random() * Short.MAX_VALUE);

    /**
     * Instance of the {@link JitsiMeetView} which this activity will display.
     */
    private JitsiMeetView view;

    /**
     * Whether the Welcome page is enabled. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private boolean welcomePageEnabled;

    private boolean canRequestOverlayPermission() {
        return
            BuildConfig.DEBUG
                && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && getApplicationInfo().targetSdkVersion
                    >= Build.VERSION_CODES.M;
    }

    /**
     *
     * @see JitsiMeetView#getWelcomePageEnabled
     */
    public boolean getWelcomePageEnabled() {
        return view == null ? welcomePageEnabled : view.getWelcomePageEnabled();
    }

    /**
     * Initializes the {@link #view} of this {@code JitsiMeetActivity} with a
     * new {@link JitsiMeetView} instance.
     */
    private void initializeView() {
        view = new JitsiMeetView(this);

        // In order to have the desired effect
        // JitsiMeetView#setWelcomePageEnabled(boolean) must be invoked before
        // JitsiMeetView#loadURL(URL).
        view.setWelcomePageEnabled(welcomePageEnabled);
        view.loadURL(null);

        setContentView(view);
    }

    /**
     * Loads the given URL and displays the conference. If the specified URL is
     * null, the welcome page is displayed instead.
     *
     * @param url - The conference URL.
     */
    public void loadURL(@Nullable URL url) {
        view.loadURL(url);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE
                && canRequestOverlayPermission()) {
            if (Settings.canDrawOverlays(this)) {
                initializeView();
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void onBackPressed() {
        if (!JitsiMeetView.onBackPressed()) {
            // Invoke the default handler if it wasn't handled by React.
            super.onBackPressed();
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // In Debug builds React needs permission to write over other apps in
        // order to display the warning and error overlays.
        if (canRequestOverlayPermission() && !Settings.canDrawOverlays(this)) {
            Intent intent
                = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName()));

            startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);
            return;
        }

        initializeView();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (view != null) {
            view.dispose();
            view = null;
        }

        JitsiMeetView.onHostDestroy(this);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void onNewIntent(Intent intent) {
        JitsiMeetView.onNewIntent(intent);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void onPause() {
        super.onPause();

        JitsiMeetView.onHostPause(this);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void onResume() {
        super.onResume();

        JitsiMeetView.onHostResume(this);
    }

    /**
     *
     * @see JitsiMeetView#setWelcomePageEnabled
     */
    public void setWelcomePageEnabled(boolean welcomePageEnabled) {
        if (view == null) {
            this.welcomePageEnabled = welcomePageEnabled;
        } else {
            view.setWelcomePageEnabled(welcomePageEnabled);
        }
    }
}
