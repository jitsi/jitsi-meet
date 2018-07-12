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
import android.view.KeyEvent;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

import java.net.URL;

/**
 * Base Activity for applications integrating Jitsi Meet at a higher level. It
 * contains all the required wiring between the {@code JitsiMeetView} and
 * the Activity lifecycle methods already implemented.
 *
 * In this activity we use a single {@code JitsiMeetView} instance. This
 * instance gives us access to a view which displays the welcome page and the
 * conference itself. All lifetime methods associated with this Activity are
 * hooked to the React Native subsystem via proxy calls through the
 * {@code JitsiMeetView} static methods.
 */
public class JitsiMeetActivity extends AppCompatActivity {
    /**
     * The request code identifying requests for the permission to draw on top
     * of other apps. The value must be 16-bit and is arbitrarily chosen here.
     */
    private static final int OVERLAY_PERMISSION_REQUEST_CODE
        = (int) (Math.random() * Short.MAX_VALUE);

    /**
     * The default behavior of this {@code JitsiMeetActivity} upon invoking the
     * back button if {@link #view} does not handle the invocation.
     */
    private DefaultHardwareBackBtnHandler defaultBackButtonImpl;

    /**
     * The default base {@code URL} used to join a conference when a partial URL
     * (e.g. a room name only) is specified. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private URL defaultURL;

    /**
     * Instance of the {@link JitsiMeetView} which this activity will display.
     */
    private JitsiMeetView view;

    /**
     * Whether Picture-in-Picture is enabled. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private Boolean pictureInPictureEnabled;

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
     * @see JitsiMeetView#getDefaultURL()
     */
    public URL getDefaultURL() {
        return view == null ? defaultURL : view.getDefaultURL();
    }

    /**
     *
     * @see JitsiMeetView#getPictureInPictureEnabled()
     */
    public boolean getPictureInPictureEnabled() {
        return
            view == null
                ? pictureInPictureEnabled
                : view.getPictureInPictureEnabled();
    }

    /**
     *
     * @see JitsiMeetView#getWelcomePageEnabled()
     */
    public boolean getWelcomePageEnabled() {
        return view == null ? welcomePageEnabled : view.getWelcomePageEnabled();
    }

    /**
     * Initializes the {@link #view} of this {@code JitsiMeetActivity} with a
     * new {@link JitsiMeetView} instance.
     */
    private void initializeContentView() {
        JitsiMeetView view = initializeView();

        if (view != null) {
            // XXX Allow extenders who override initializeView() to configure
            // the view before the first loadURL(). Probably works around a
            // problem related to ReactRootView#setAppProperties().
            view.loadURL(null);

            this.view = view;
            setContentView(this.view);
        }
    }

    /**
     * Initializes a new {@link JitsiMeetView} instance.
     *
     * @return a new {@code JitsiMeetView} instance.
     */
    protected JitsiMeetView initializeView() {
        JitsiMeetView view = new JitsiMeetView(this);

        // XXX Before calling JitsiMeetView#loadURL, make sure to call whatever
        // is documented to need such an order in order to take effect:
        view.setDefaultURL(defaultURL);
        if (pictureInPictureEnabled != null) {
            view.setPictureInPictureEnabled(
                pictureInPictureEnabled.booleanValue());
        }
        view.setWelcomePageEnabled(welcomePageEnabled);

        return view;
    }

    /**
     * Loads the given URL and displays the conference. If the specified URL is
     * null, the welcome page is displayed instead.
     *
     * @param url The conference URL.
     */
    public void loadURL(@Nullable URL url) {
        view.loadURL(url);
    }

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE
                && canRequestOverlayPermission()) {
            if (Settings.canDrawOverlays(this)) {
                initializeContentView();
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (!ReactActivityLifecycleAdapter.onBackPressed()) {
            // JitsiMeetView didn't handle the invocation of the back button.
            // Generally, an Activity extender would very likely want to invoke
            // Activity#onBackPressed(). For the sake of consistency with
            // JitsiMeetView and within the Jitsi Meet SDK for Android though,
            // JitsiMeetActivity does what JitsiMeetView would've done if it
            // were able to handle the invocation.
            if (defaultBackButtonImpl == null) {
                super.onBackPressed();
            } else {
                defaultBackButtonImpl.invokeDefaultOnBackPressed();
            }
        }
    }

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

        initializeContentView();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (view != null) {
            view.dispose();
            view = null;
        }

        ReactActivityLifecycleAdapter.onHostDestroy(this);
    }

    // ReactAndroid/src/main/java/com/facebook/react/ReactActivity.java
    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        ReactInstanceManager reactInstanceManager;

        if (!super.onKeyUp(keyCode, event)
                && BuildConfig.DEBUG
                && (reactInstanceManager
                        = ReactInstanceManagerHolder.getReactInstanceManager())
                    != null
                && keyCode == KeyEvent.KEYCODE_MENU) {
            reactInstanceManager.showDevOptionsDialog();
            return true;
        }
        return false;
    }

    @Override
    public void onNewIntent(Intent intent) {
        // XXX At least twice we received bug reports about malfunctioning
        // loadURL in the Jitsi Meet SDK while the Jitsi Meet app seemed to
        // functioning as expected in our testing. But that was to be expected
        // because the app does not exercise loadURL. In order to increase the
        // test coverage of loadURL, channel deep linking through loadURL.
        Uri uri;

        if (Intent.ACTION_VIEW.equals(intent.getAction())
                && (uri = intent.getData()) != null
                && JitsiMeetView.loadURLStringInViews(uri.toString())) {
            return;
        }

        ReactActivityLifecycleAdapter.onNewIntent(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();

        defaultBackButtonImpl = new DefaultHardwareBackBtnHandlerImpl(this);
        ReactActivityLifecycleAdapter.onHostResume(this, defaultBackButtonImpl);
    }

    @Override
    public void onStop() {
        super.onStop();

        ReactActivityLifecycleAdapter.onHostPause(this);
        defaultBackButtonImpl = null;
    }

    @Override
    protected void onUserLeaveHint() {
        if (view != null) {
            view.enterPictureInPicture();
        }
    }

    /**
     *
     * @see JitsiMeetView#setDefaultURL(URL)
     */
    public void setDefaultURL(URL defaultURL) {
        if (view == null) {
            this.defaultURL = defaultURL;
        } else {
            view.setDefaultURL(defaultURL);
        }
    }

    /**
     *
     * @see JitsiMeetView#setPictureInPictureEnabled(boolean)
     */
    public void setPictureInPictureEnabled(boolean pictureInPictureEnabled) {
        if (view == null) {
            this.pictureInPictureEnabled
                = Boolean.valueOf(pictureInPictureEnabled);
        } else {
            view.setPictureInPictureEnabled(pictureInPictureEnabled);
        }
    }

    /**
     *
     * @see JitsiMeetView#setWelcomePageEnabled(boolean)
     */
    public void setWelcomePageEnabled(boolean welcomePageEnabled) {
        if (view == null) {
            this.welcomePageEnabled = welcomePageEnabled;
        } else {
            view.setWelcomePageEnabled(welcomePageEnabled);
        }
    }
}
