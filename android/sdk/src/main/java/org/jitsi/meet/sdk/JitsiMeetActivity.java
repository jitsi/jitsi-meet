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

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.FragmentActivity;
import android.util.Log;

import com.facebook.react.modules.core.PermissionListener;

import java.util.Map;


/**
 * A base activity for SDK users to embed. It uses {@link JitsiMeetFragment} to do the heavy
 * lifting and wires the remaining Activity lifecycle methods so it works out of the box.
 */
public class JitsiMeetActivity extends FragmentActivity
        implements JitsiMeetActivityInterface, JitsiMeetViewListener {

    protected static final String TAG = JitsiMeetActivity.class.getSimpleName();

    // Overrides
    //

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_jitsi_meet);

        if (!extraInitialize()) {
            initialize();
        }
    }

    @Override
    public void finish() {
        getJitsiView().leave();

        super.finish();
    }

    // Helper methods
    //

    protected JitsiMeetView getJitsiView() {
        JitsiMeetFragment fragment
            = (JitsiMeetFragment) getSupportFragmentManager().findFragmentById(R.id.jitsiFragment);
        return fragment.getJitsiView();
    }

    protected void join(@Nullable String url) {
        JitsiMeetConferenceOptions options
            = new JitsiMeetConferenceOptions.Builder()
                .setRoom(url)
                .build();
        join(options);
    }

    protected void join(JitsiMeetConferenceOptions options) {
        getJitsiView().join(options);
    }

    private @Nullable JitsiMeetConferenceOptions getConferenceOptions(Intent intent) {
        Uri uri;

        if (Intent.ACTION_VIEW.equals(intent.getAction())
                && (uri = intent.getData()) != null) {
            JitsiMeetConferenceOptions options
                = new JitsiMeetConferenceOptions.Builder()
                    .setRoom(uri.toString())
                    .build();
            return options;
        }

        // TODO: accept JitsiMeetConferenceOptions directly.

        return null;
    }

    /**
     * Helper function called during activity initialization. If {@code true} is returned, the
     * initialization is delayed and the {@link JitsiMeetActivity#initialize()} method is not
     * called. In this case, it's up to the subclass to call the initialize method when ready.
     *
     * This is mainly required so we do some extra initialization in the Jitsi Meet app.
     *
     * @return {@code true} if the initialization will be delayed, {@code false} otherwise.
     */
    protected boolean extraInitialize() {
        return false;
    }

    protected void initialize() {
        // Listen for conference events.
        getJitsiView().setListener(this);

        // Join the room specified by the URL the app was launched with.
        // Joining without the room option displays the welcome page.
        join(getConferenceOptions(getIntent()));
    }

    // Activity lifecycle methods
    //

    @Override
    public void onBackPressed() {
        JitsiMeetActivityDelegate.onBackPressed();
    }

    @Override
    public void onNewIntent(Intent intent) {
        JitsiMeetConferenceOptions options;

        if ((options = getConferenceOptions(intent)) != null) {
            join(options);
            return;
        }

        JitsiMeetActivityDelegate.onNewIntent(intent);
    }

    @Override
    protected void onUserLeaveHint() {
        getJitsiView().enterPictureInPicture();
    }

    // JitsiMeetActivityInterface
    //

    @Override
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        JitsiMeetActivityDelegate.requestPermissions(this, permissions, requestCode, listener);
    }

    // JitsiMeetViewListener
    //

    @Override
    public void onConferenceJoined(Map<String, Object> data) {
        Log.d(TAG, "Conference joined: " + data);
    }

    @Override
    public void onConferenceTerminated(Map<String, Object> data) {
        Log.d(TAG, "Conference terminated: " + data);
        finish();
    }

    @Override
    public void onConferenceWillJoin(Map<String, Object> data) {
        Log.d(TAG, "Conference will join: " + data);
    }
}
