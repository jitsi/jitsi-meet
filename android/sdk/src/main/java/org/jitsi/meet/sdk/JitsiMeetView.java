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

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.widget.FrameLayout;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.common.LifecycleState;

import java.net.URL;
import java.util.HashMap;


public class JitsiMeetView extends FrameLayout {
    /**
     * Background color used by this view and the React Native root view.
     */
    private static final int BACKGROUND_COLOR = 0xFF111111;

    /**
     * {@JitsiMeetView.Listener} instance for reporting events occurring in Jitsi Meet.
     */
    private JitsiMeetView.Listener listener;

    /**
     * Reference to the single instance of this class we currently allow. It's currently used for
     * fetching the instance from the listener's callbacks.
     *
     * TODO: lift this limitation.
     */
    private static JitsiMeetView mInstance;

    /**
     * React Native bridge. The instance manager allows embedding applications to create multiple
     * root views off the same JavaScript bundle.
     */
    private static ReactInstanceManager mReactInstanceManager;

    /**
     * React Native root view.
     */
    private ReactRootView mReactRootView;

    public JitsiMeetView(@NonNull Context context) {
        super(context);

        if (mInstance != null) {
            throw new RuntimeException("Only a single instance is currently allowed");
        }

        /*
         * TODO: Only allow a single instance for now. All React Native modules are
         * kinda singletons so global state would be broken since we have a single
         * bridge. Once we have that sorted out multiple instances of JitsiMeetView
         * will be allowed.
         */
        mInstance = this;

        setBackgroundColor(BACKGROUND_COLOR);

        if (mReactInstanceManager == null) {
            initReactInstanceManager(((Activity)context).getApplication());
        }
    }

    /**
     * Returns the only instance of this class we currently allow creating.
     *
     * @returns The {@JitsiMeetView} instance.
     */
    public static JitsiMeetView getInstance() {
        return mInstance;
    }

    /**
     * Getter for the {@JitsiMeetView.Listener} set on this view.
     *
     * @returns The {@JitsiMeetView.Listener} instance.
     */
    public Listener getListener() {
        return listener;
    }

    /**
     * Internal method to initialize the React Native instance manager. We create a single instance
     * in order to load the JavaScript bundle a single time. All <tt>ReactRootView</tt> instances
     * will be tied to the one and only <tt>ReactInstanceManager</tt>.
     *
     * @param application - <tt>Application</tt> instance which is running.
     */
    private static void initReactInstanceManager(Application application) {
        mReactInstanceManager = ReactInstanceManager.builder()
            .setApplication(application)
            .setBundleAssetName("index.android.bundle")
            .setJSMainModuleName("index.android")
            .addPackage(new com.corbt.keepawake.KCKeepAwakePackage())
            .addPackage(new com.facebook.react.shell.MainReactPackage())
            .addPackage(new com.oblador.vectoricons.VectorIconsPackage())
            .addPackage(new com.ocetnik.timer.BackgroundTimerPackage())
            .addPackage(new com.oney.WebRTCModule.WebRTCModulePackage())
            .addPackage(new com.rnimmersive.RNImmersivePackage())
            .addPackage(new org.jitsi.meet.sdk.audiomode.AudioModePackage())
            .addPackage(new org.jitsi.meet.sdk.externalapi.ExternalAPIPackage())
            .addPackage(new org.jitsi.meet.sdk.proximity.ProximityPackage())
            .setUseDeveloperSupport(BuildConfig.DEBUG)
            .setInitialLifecycleState(LifecycleState.RESUMED)
            .build();
    }

    /**
     * Loads the given URL and displays the conference. If the specified URL is null, the welcome
     * page is displayed instead.
     *
     * @param url - The conference URL.
     */
    public void loadURL(@Nullable URL url) {
        Bundle props = new Bundle();

        if (url != null) {
            props.putString("url", url.toString());
        }

        // TODO: ReactRootView#setAppProperties is only available on React Native 0.45, so destroy
        // the current root view and create a new one.
        if (mReactRootView != null) {
            removeView(mReactRootView);
            mReactRootView = null;
        }

        mReactRootView = new ReactRootView(getContext());
        mReactRootView.startReactApplication(mReactInstanceManager, "App", props);
        mReactRootView.setBackgroundColor(BACKGROUND_COLOR);
        addView(mReactRootView);
    }

    /**
     * Setter for the {@JitsiMeetView.Listener} set on this view.
     *
     * @param listener - Listener for this view.
     */
    public void setListener(Listener listener) {
        this.listener = listener;
    }

    /**
     * Activity lifecycle method which should be called from <tt>Activity.onBackPressed</tt> so
     * we can do the required internal processing.
     *
     * @return - true if the back-press was processed, false otherwise. In case false is returned
     * the application should call the parent's implementation.
     */
    public static boolean onBackPressed() {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onBackPressed();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Activity lifecycle method which should be called from <tt>Activity.onDestroy</tt> so
     * we can do the required internal processing.
     *
     * @param activity - <tt>Activity</tt> being destroyed.
     */
    public static void onHostDestroy(Activity activity) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostDestroy(activity);
        }
    }

    /**
     * Activity lifecycle method which should be called from <tt>Activity.onPause</tt> so
     * we can do the required internal processing.
     *
     * @param activity - <tt>Activity</tt> being paused.
     */
    public static void onHostPause(Activity activity) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostPause(activity);
        }
    }

    /**
     * Activity lifecycle method which should be called from <tt>Activity.onResume</tt> so
     * we can do the required internal processing.
     *
     * @param activity - <tt>Activity</tt> being resumed.
     */
    public static void onHostResume(Activity activity) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(activity, null);
        }
    }

    /**
     * Activity lifecycle method which should be called from <tt>Activity.onNewIntent</tt> so
     * we can do the required internal processing. Note that this is only needed if the activity's
     * "launchMode" was set to "singleTask". This is required for deep linking to work once the
     * application is already running.
     *
     * @param intent - <tt>Intent</tt> instance which was received.
     */
    public static void onNewIntent(Intent intent) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onNewIntent(intent);
        }
    }

    /**
     * Interface for listening to events coming from Jitsi Meet.
     */
    public interface Listener {
        /**
         * Called when joining a conference fails or an ongoing conference is interrupted due to a
         * failure.
         * @param data - HashMap with an "error" key describing the problem, and a "url" key with
         *             the conference URL.
         */
        void onConferenceFailed(HashMap<String, Object> data);

        /**
         * Called when a conference was joined.
         * @param data - HashMap with a "url" key with the conference URL.
         */
        void onConferenceJoined(HashMap<String, Object> data);

        /**
         * Called when the conference was left, typically after hanging up.
         * @param data - HashMap with a "url" key with the conference URL.
         */
        void onConferenceLeft(HashMap<String, Object> data);

        /**
         * Called before the conference is joined.
         * @param data - HashMap with a "url" key with the conference URL.
         */
        void onConferenceWillJoin(HashMap<String, Object> data);

        /**
         * Called before the conference is left.
         * @param data - HashMap with a "url" key with the conference URL.
         */
        void onConferenceWillLeave(HashMap<String, Object> data);
    }
}
