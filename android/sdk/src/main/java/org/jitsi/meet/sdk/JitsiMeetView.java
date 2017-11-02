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
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

import java.net.URL;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
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

    private static List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
            new AndroidSettingsModule(reactContext),
            new AppInfoModule(reactContext),
            new AudioModeModule(reactContext),
            new ExternalAPIModule(reactContext),
            new ProximityModule(reactContext)
        );
    }

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
     * time. All {@code ReactRootView} instances will be tied to the one and
     * only {@code ReactInstanceManager}.
     *
     * @param application {@code Application} instance which is running.
     */
    private static void initReactInstanceManager(Application application) {
        reactInstanceManager
            = ReactInstanceManager.builder()
                .setApplication(application)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModulePath("index.android")
                .addPackage(new com.corbt.keepawake.KCKeepAwakePackage())
                .addPackage(new com.facebook.react.shell.MainReactPackage())
                .addPackage(new com.oblador.vectoricons.VectorIconsPackage())
                .addPackage(new com.ocetnik.timer.BackgroundTimerPackage())
                .addPackage(new com.oney.WebRTCModule.WebRTCModulePackage())
                .addPackage(new com.RNFetchBlob.RNFetchBlobPackage())
                .addPackage(new com.rnimmersive.RNImmersivePackage())
                .addPackage(new ReactPackageAdapter() {
                    @Override
                    public List<NativeModule> createNativeModules(
                            ReactApplicationContext reactContext) {
                        return JitsiMeetView.createNativeModules(reactContext);
                    }
                })
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();
    }

    /**
     * Loads a specific URL {@code String} in all existing
     * {@code JitsiMeetView}s.
     *
     * @param urlString he URL {@code String} to load in all existing
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
     * {@code Activity.onBackPressed} so we can do the required internal
     * processing.
     *
     * @return {@code true} if the back-press was processed; {@code false},
     * otherwise. If {@code false}, the application should call the parent's
     * implementation.
     */
    public static boolean onBackPressed() {
        if (reactInstanceManager == null) {
            return false;
        } else {
            reactInstanceManager.onBackPressed();
            return true;
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onDestroy} so we can do the required internal
     * processing.
     *
     * @param activity {@code Activity} being destroyed.
     */
    public static void onHostDestroy(Activity activity) {
        if (reactInstanceManager != null) {
            reactInstanceManager.onHostDestroy(activity);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onPause} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being paused.
     */
    public static void onHostPause(Activity activity) {
        if (reactInstanceManager != null) {
            reactInstanceManager.onHostPause(activity);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     */
    public static void onHostResume(Activity activity) {
        onHostResume(activity, new DefaultHardwareBackBtnHandlerImpl(activity));
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     * @param defaultBackButtonImpl a {@code DefaultHardwareBackBtnHandler} to
     * handle invoking the back button if no {@code JitsiMeetView} handles it.
     */
    public static void onHostResume(
            Activity activity,
            DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
        if (reactInstanceManager != null) {
            reactInstanceManager.onHostResume(activity, defaultBackButtonImpl);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onNewIntent} so we can do the required internal
     * processing. Note that this is only needed if the activity's "launchMode"
     * was set to "singleTask". This is required for deep linking to work once
     * the application is already running.
     *
     * @param intent {@code Intent} instance which was received.
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
     * The default base {@code URL} used to join a conference when a partial URL
     * (e.g. a room name only) is specified to {@link #loadURLString(String)} or
     * {@link #loadURLObject(Bundle)}.
     */
    private URL defaultURL;

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
     * Gets the default base {@code URL} used to join a conference when a
     * partial URL (e.g. a room name only) is specified to
     * {@link #loadURLString(String)} or {@link #loadURLObject(Bundle)}. If not
     * set or if set to {@code null}, the default built in JavaScript is used:
     * {@link https://meet.jit.si}
     *
     * @return The default base {@code URL} or {@code null}.
     */
    public URL getDefaultURL() {
        return defaultURL;
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
     * @return {@code true} if the Welcome page is enabled; otherwise,
     * {@code false}.
     */
    public boolean getWelcomePageEnabled() {
        return welcomePageEnabled;
    }

    /**
     * Loads a specific {@link URL} which may identify a conference to join. If
     * the specified {@code URL} is {@code null} and the Welcome page is
     * enabled, the Welcome page is displayed instead.
     *
     * @param url The {@code URL} to load which may identify a conference to
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
     * @param urlObject The URL to load which may identify a conference to join.
     */
    public void loadURLObject(@Nullable Bundle urlObject) {
        Bundle props = new Bundle();

        // defaultURL
        if (defaultURL != null) {
            props.putString("defaultURL", defaultURL.toString());
        }
        // externalAPIScope
        props.putString("externalAPIScope", externalAPIScope);
        // url
        if (urlObject != null) {
            props.putBundle("url", urlObject);
        }
        // welcomePageEnabled
        props.putBoolean("welcomePageEnabled", welcomePageEnabled);

        // XXX The method loadURLObject: is supposed to be imperative i.e.
        // a second invocation with one and the same URL is expected to join
        // the respective conference again if the first invocation was followed
        // by leaving the conference. However, React and, respectively,
        // appProperties/initialProperties are declarative expressions i.e. one
        // and the same URL will not trigger componentWillReceiveProps in the
        // JavaScript source code. The workaround implemented bellow introduces
        // imperativeness in React Component props by defining a unique value
        // per loadURLObject: invocation.
        props.putLong("timestamp", System.currentTimeMillis());

        if (reactRootView == null) {
            reactRootView = new ReactRootView(getContext());
            reactRootView.startReactApplication(
                reactInstanceManager, "App", props);
            reactRootView.setBackgroundColor(BACKGROUND_COLOR);
            addView(reactRootView);
        } else {
            reactRootView.setAppProperties(props);
        }
    }

    /**
     * Loads a specific URL {@link String} which may identify a conference to
     * join. If the specified URL {@code String} is {@code null} and the Welcome
     * page is enabled, the Welcome page is displayed instead.
     *
     * @param urlString The URL {@code String} to load which may identify a
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
     * Sets the default base {@code URL} used to join a conference when a
     * partial URL (e.g. a room name only) is specified to
     * {@link #loadURLString(String)} or {@link #loadURLObject(Bundle)}. Must be
     * called before {@link #loadURL(URL)} for it to take effect.
     *
     * @param defaultURL The {@code URL} to be set as the default base URL.
     * @see #getDefaultURL()
     */
    public void setDefaultURL(URL defaultURL) {
        this.defaultURL = defaultURL;
    }

    /**
     * Sets a specific {@link JitsiMeetViewListener} on this
     * {@code JitsiMeetView}.
     *
     * @param listener The {@code JitsiMeetViewListener} to set on this
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
