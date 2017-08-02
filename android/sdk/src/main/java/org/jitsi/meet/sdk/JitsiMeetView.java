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
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.widget.FrameLayout;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.common.LifecycleState;

import java.net.URL;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.WeakHashMap;

public class JitsiMeetView extends FrameLayout {
    /**
     * Background color used by {@code JitsiMeetView} and the React Native root
     * view.
     */
    private static final int BACKGROUND_COLOR = 0xFF111111;

    /**
     * React Native bridge. The instance manager allows embedding applications
     * to create multiple root views off the same JavaScript bundle.
     */
    private static ReactInstanceManager reactInstanceManager;

    private static final Set<JitsiMeetView> views
        = Collections.newSetFromMap(new WeakHashMap<JitsiMeetView, Boolean>());

    public static JitsiMeetView findViewByExternalAPIScope(
            String externalAPIScope) {
        synchronized (views) {
            for (JitsiMeetView view : views) {
                if (view.externalAPIScope.equals(externalAPIScope)) {
                    return view;
                }
            }
        }

        return null;
    }

    /**
     * Internal method to initialize the React Native instance manager. We
     * create a single instance in order to load the JavaScript bundle a single
     * time. All <tt>ReactRootView</tt> instances will be tied to the one and
     * only <tt>ReactInstanceManager</tt>.
     *
     * @param application - <tt>Application</tt> instance which is running.
     */
    private static void initReactInstanceManager(Application application) {
        reactInstanceManager
            = ReactInstanceManager.builder()
                .setApplication(application)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModuleName("index.android")
                .addPackage(new com.corbt.keepawake.KCKeepAwakePackage())
                .addPackage(new com.facebook.react.shell.MainReactPackage())
                .addPackage(new com.oblador.vectoricons.VectorIconsPackage())
                .addPackage(new com.ocetnik.timer.BackgroundTimerPackage())
                .addPackage(new com.oney.WebRTCModule.WebRTCModulePackage())
                .addPackage(new com.RNFetchBlob.RNFetchBlobPackage())
                .addPackage(new com.rnimmersive.RNImmersivePackage())
                .addPackage(new org.jitsi.meet.sdk.audiomode.AudioModePackage())
                .addPackage(
                    new org.jitsi.meet.sdk.externalapi.ExternalAPIPackage())
                .addPackage(new org.jitsi.meet.sdk.proximity.ProximityPackage())
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();
    }

    /**
     * Loads a specific URL {@code String} in all existing
     * {@code JitsiMeetView}s.
     *
     * @param urlString - The URL {@code String} to load in all existing
     * {@code JitsiMeetView}s.
     * @return If the specified {@code urlString} was submitted for loading in
     * at least one {@code JitsiMeetView}, then {@code true}; otherwise,
     * {@code false}.
     */
    private static boolean loadURLStringInViews(String urlString) {
        synchronized (views) {
            if (!views.isEmpty()) {
                for (JitsiMeetView view : views) {
                    view.loadURLString(urlString);
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Activity lifecycle method which should be called from
     * <tt>Activity.onBackPressed</tt> so we can do the required internal
     * processing.
     *
     * @return - true if the back-press was processed, false otherwise. In case
     * false is returned the application should call the parent's
     * implementation.
     */
    public static boolean onBackPressed() {
        if (reactInstanceManager != null) {
            reactInstanceManager.onBackPressed();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * <tt>Activity.onDestroy</tt> so we can do the required internal
     * processing.
     *
     * @param activity - <tt>Activity</tt> being destroyed.
     */
    public static void onHostDestroy(Activity activity) {
        if (reactInstanceManager != null) {
            reactInstanceManager.onHostDestroy(activity);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * <tt>Activity.onPause</tt> so we can do the required internal processing.
     *
     * @param activity - <tt>Activity</tt> being paused.
     */
    public static void onHostPause(Activity activity) {
        if (reactInstanceManager != null) {
            reactInstanceManager.onHostPause(activity);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * <tt>Activity.onResume</tt> so we can do the required internal processing.
     *
     * @param activity - <tt>Activity</tt> being resumed.
     */
    public static void onHostResume(Activity activity) {
        if (reactInstanceManager != null) {
            reactInstanceManager.onHostResume(activity, null);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * <tt>Activity.onNewIntent</tt> so we can do the required internal
     * processing. Note that this is only needed if the activity's "launchMode"
     * was set to "singleTask". This is required for deep linking to work once
     * the application is already running.
     *
     * @param intent - <tt>Intent</tt> instance which was received.
     */
    public static void onNewIntent(Intent intent) {
        // XXX At least twice we received bug reports about malfunctioning
        // loadURL in the Jitsi Meet SDK while the Jitsi Meet app seemed to
        // functioning as expected in our testing. But that was to be expected
        // because the app does not exercise loadURL. In order to increase the
        // test coverage of loadURL, channel deep linking through loadURL.
        Uri uri;

        if (Intent.ACTION_VIEW.equals(intent.getAction())
                && (uri = intent.getData()) != null
                && loadURLStringInViews(uri.toString())) {
            return;
        }

        if (reactInstanceManager != null) {
            reactInstanceManager.onNewIntent(intent);
        }
    }

    /**
     * The unique identifier of this {@code JitsiMeetView} within the process
     * for the purposes of {@link ExternalAPI}. The name scope was inspired by
     * postis which we use on Web for the similar purposes of the iframe-based
     * external API.
     */
    private final String externalAPIScope;

    /**
     * {@link JitsiMeetViewListener} instance for reporting events occurring in
     * Jitsi Meet.
     */
    private JitsiMeetViewListener listener;

    /**
     * React Native root view.
     */
    private ReactRootView reactRootView;

    /**
     * Whether the Welcome page is enabled.
     */
    private boolean welcomePageEnabled;

    public JitsiMeetView(@NonNull Context context) {
        super(context);

        setBackgroundColor(BACKGROUND_COLOR);

        if (reactInstanceManager == null) {
            initReactInstanceManager(((Activity) context).getApplication());
        }

        // Hook this JitsiMeetView into ExternalAPI.
        externalAPIScope = UUID.randomUUID().toString();
        synchronized (views) {
            views.add(this);
        }
    }

    /**
     * Releases the React resources (specifically the {@link ReactRootView})
     * associated with this view.
     *
     * This method MUST be called when the Activity holding this view is
     * destroyed, typically in the {@code onDestroy} method.
     */
    public void dispose() {
        if (reactRootView != null) {
            removeView(reactRootView);
            reactRootView.unmountReactApplication();
            reactRootView = null;
        }
    }

    /**
     * Gets the {@link JitsiMeetViewListener} set on this {@code JitsiMeetView}.
     *
     * @return The {@code JitsiMeetViewListener} set on this
     * {@code JitsiMeetView}.
     */
    public JitsiMeetViewListener getListener() {
        return listener;
    }

    /**
     * Gets whether the Welcome page is enabled. If {@code true}, the Welcome
     * page is rendered when this {@code JitsiMeetView} is not at a URL
     * identifying a Jitsi Meet conference/room.
     *
     * @return {@true} if the Welcome page is enabled; otherwise, {@code false}.
     */
    public boolean getWelcomePageEnabled() {
        return welcomePageEnabled;
    }

    /**
     * Loads a specific {@link URL} which may identify a conference to join. If
     * the specified {@code URL} is {@code null} and the Welcome page is
     * enabled, the Welcome page is displayed instead.
     *
     * @param url - The {@code URL} to load which may identify a conference to
     * join.
     */
    public void loadURL(@Nullable URL url) {
        loadURLString(url == null ? null : url.toString());
    }

    /**
     * Loads a specific URL which may identify a conference to join. The URL is
     * specified in the form of a {@link Bundle} of properties which (1)
     * internally are sufficient to construct a URL {@code String} while (2)
     * abstracting the specifics of constructing the URL away from API
     * clients/consumers. If the specified URL is {@code null} and the Welcome
     * page is enabled, the Welcome page is displayed instead.
     *
     * @param urlObject - The URL to load which may identify a conference to
     * join.
     */
    public void loadURLObject(@Nullable Bundle urlObject) {
        Bundle props = new Bundle();

        // externalAPIScope
        props.putString("externalAPIScope", externalAPIScope);
        // url
        if (urlObject != null) {
            props.putBundle("url", urlObject);
        }
        // welcomePageEnabled
        props.putBoolean("welcomePageEnabled", welcomePageEnabled);

        // TODO: ReactRootView#setAppProperties is only available on React
        // Native 0.45, so destroy the current root view and create a new one.
        dispose();

        reactRootView = new ReactRootView(getContext());
        reactRootView.startReactApplication(reactInstanceManager, "App", props);
        reactRootView.setBackgroundColor(BACKGROUND_COLOR);
        addView(reactRootView);
    }

    /**
     * Loads a specific URL {@link String} which may identify a conference to
     * join. If the specified URL {@code String} is {@code null} and the Welcome
     * page is enabled, the Welcome page is displayed instead.
     *
     * @param urlString - The URL {@code String} to load which may identify a
     * conference to join.
     */
    public void loadURLString(@Nullable String urlString) {
        Bundle urlObject;

        if (urlString == null) {
            urlObject = null;
        } else {
            urlObject = new Bundle();
            urlObject.putString("url", urlString);
        }
        loadURLObject(urlObject);
    }

    /**
     * Sets a specific {@link JitsiMeetViewListener} on this
     * {@code JitsiMeetView}.
     *
     * @param listener - The {@code JitsiMeetViewListener} to set on this
     * {@code JitsiMeetView}.
     */
    public void setListener(JitsiMeetViewListener listener) {
        this.listener = listener;
    }

    /**
     * Sets whether the Welcome page is enabled. Must be called before
     * {@link #loadURL(URL)} for it to take effect.
     *
     * @param welcomePageEnabled {@code true} to enable the Welcome page;
     * otherwise, {@code false}.
     */
    public void setWelcomePageEnabled(boolean welcomePageEnabled) {
        this.welcomePageEnabled = welcomePageEnabled;
    }
}
