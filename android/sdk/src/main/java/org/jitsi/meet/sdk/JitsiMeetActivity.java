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
import android.os.Bundle;
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
     * Instance of the {@link JitsiMeetView} which this activity will display.
     */
    private JitsiMeetView view;

    /**
     * Whether the Welcome page is enabled. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private boolean welcomePageEnabled;

    /**
     *
     * @see JitsiMeetView#getWelcomePageEnabled
     */
    public boolean getWelcomePageEnabled() {
        return view == null ? welcomePageEnabled : view.getWelcomePageEnabled();
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

        view = new JitsiMeetView(this);

        // In order to have the desired effect
        // JitsiMeetView#setWelcomePageEnabled(boolean) must be invoked before
        // JitsiMeetView#loadURL(URL).
        view.setWelcomePageEnabled(welcomePageEnabled);
        view.loadURL(null);

        setContentView(view);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void onDestroy() {
        super.onDestroy();

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
