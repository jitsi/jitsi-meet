/*
 * Copyright @ 2017-present 8x8, Inc.
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

import android.app.Application;

import androidx.annotation.Nullable;

import com.facebook.react.ReactHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.defaults.DefaultComponentsRegistry;
import com.facebook.react.defaults.DefaultReactHostDelegate;
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.runtime.ReactHostImpl;
import com.facebook.react.runtime.hermes.HermesInstance;
import com.facebook.react.uimanager.ViewManager;
import com.oney.WebRTCModule.EglUtils;
import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.webrtc.EglBase;

import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

class ReactHostHolder {
    private static final String TAG = ReactHostHolder.class.getSimpleName();

    /**
     * FIXME (from linter): Do not place Android context classes in static
     * fields (static reference to ReactHost which holds a reference to the
     * application Context); this is a memory leak (and also breaks Instant
     * Run).
     *
     * {@link ReactHost} is the new architecture replacement for
     * ReactInstanceManager. It manages the React Native runtime in
     * bridgeless (Fabric + TurboModules) mode.
     */
    private static ReactHost reactHost;

    /**
     * Application reference kept for re-creating the host after destroy.
     */
    private static Application application;

    private static List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> nativeModules
            = new ArrayList<>(Arrays.<NativeModule>asList(
                new AndroidSettingsModule(reactContext),
                new AppInfoModule(reactContext),
                new AudioModeModule(reactContext),
                new DropboxModule(reactContext),
                new ExternalAPIModule(reactContext),
                new LocaleDetector(reactContext),
                new LogBridgeModule(reactContext),
                new PictureInPictureModule(reactContext),
                new ProximityModule(reactContext)));

        if (AudioModeModule.useConnectionService()) {
            nativeModules.add(new RNConnectionService(reactContext));
        }

        return nativeModules;
    }

    private static List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    static List<ReactPackage> getReactNativePackages() {
        List<ReactPackage> packages
            = new ArrayList<>(Arrays.asList(
            new com.reactnativecommunity.asyncstorage.AsyncStoragePackage(),
            new com.ocetnik.timer.BackgroundTimerPackage(),
            new com.calendarevents.RNCalendarEventsPackage(),
            new com.sayem.keepawake.KCKeepAwakePackage(),
            new com.facebook.react.shell.MainReactPackage(),
            new com.reactnativecommunity.clipboard.ClipboardPackage(),
            new com.reactnativecommunity.netinfo.NetInfoPackage(),
            new com.reactnativepagerview.PagerViewPackage(),
            new com.oblador.performance.PerformancePackage(),
            new com.reactnativecommunity.slider.ReactSliderPackage(),
            new com.brentvatne.react.ReactVideoPackage(),
            new com.reactnativecommunity.webview.RNCWebViewPackage(),
            new com.kevinresol.react_native_default_preference.RNDefaultPreferencePackage(),
            new com.learnium.RNDeviceInfo.RNDeviceInfo(),
            new com.oney.WebRTCModule.WebRTCModulePackage(),
            new com.swmansion.gesturehandler.RNGestureHandlerPackage(),
            new org.linusu.RNGetRandomValuesPackage(),
            new com.swmansion.rnscreens.RNScreensPackage(),
            new com.zmxv.RNSound.SoundPackage(),
            new com.th3rdwave.safeareacontext.SafeAreaContextPackage(),
            new com.horcrux.svg.SvgPackage(),
            new org.wonday.orientation.OrientationPackage(),
            new com.splashview.SplashViewPackage(),
            new com.worklets.WorkletsCorePackage(),
            new ReactPackageAdapter() {
                @Override
                public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
                    return ReactHostHolder.createNativeModules(reactContext);
                }
                @Override
                public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
                    return ReactHostHolder.createViewManagers(reactContext);
                }
            }));

        // AmplitudeReactNativePackage
        try {
            Class<?> amplitudePackageClass = Class.forName("com.amplitude.reactnative.AmplitudeReactNativePackage");
            Constructor<?> constructor = amplitudePackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
            JitsiMeetLogger.d(TAG, "Not loading AmplitudeReactNativePackage");
        }

        // GiphyReactNativeSdkPackage
        try {
            Class<?> giphyPackageClass = Class.forName("com.giphyreactnativesdk.RTNGiphySdkPackage");
            Constructor<?> constructor = giphyPackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
            JitsiMeetLogger.d(TAG, "Not loading GiphyReactNativeSdkPackage");
        }

        // RNGoogleSignInPackage
        try {
            Class<?> googlePackageClass = Class.forName("com.reactnativegooglesignin.RNGoogleSigninPackage");
            Constructor<?> constructor = googlePackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
            JitsiMeetLogger.d(TAG, "Not loading RNGoogleSignInPackage");
        }

        return packages;
    }

    /**
     * Helper function to send an event to JavaScript.
     *
     * @param eventName {@code String} containing the event name.
     * @param data {@code Object} optional ancillary data for the event.
     */
    static void emitEvent(
            String eventName,
            @Nullable Object data) {
        if (reactHost != null) {
            ReactContext reactContext = reactHost.getCurrentReactContext();

            if (reactContext != null) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, data);
            }
        }
    }

    /**
     * Finds a native React module for given class.
     *
     * @param nativeModuleClass the native module's class for which an instance
     * is to be retrieved from the {@link ReactHost}.
     * @param <T> the module's type.
     * @return {@link NativeModule} instance for given interface type or
     * {@code null} if no instance for this interface is available, or if
     * the host has not been initialized yet.
     */
    static <T extends NativeModule> T getNativeModule(
            Class<T> nativeModuleClass) {
        ReactContext reactContext
            = reactHost != null
                ? reactHost.getCurrentReactContext() : null;

        return reactContext != null
                ? reactContext.getNativeModule(nativeModuleClass) : null;
    }

    static ReactHost getReactHost() {
        return reactHost;
    }

    /**
     * Initializes WebRTC options, builds the {@link ReactHost}, and starts
     * the React Native runtime.
     *
     * @param app {@code Application} instance
     */
    static void initReactHost(Application app) {
        if (reactHost != null) {
            return;
        }

        application = app;

        // Initialize the WebRTC module options.
        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        options.enableMediaProjectionService = true;
        if (options.videoDecoderFactory == null || options.videoEncoderFactory == null) {
            EglBase.Context eglContext = EglUtils.getRootEglBaseContext();
            if (options.videoDecoderFactory == null) {
                options.videoDecoderFactory = new JitsiVideoDecoderFactory(eglContext);
            }
            if (options.videoEncoderFactory == null) {
                options.videoEncoderFactory = new JitsiVideoEncoderFactory(eglContext);
            }
        }

        JitsiMeetLogger.d(TAG + " initializing RN");

        // Same construction DefaultReactHost.getDefaultReactHost does internally,
        // minus its never-cleared static cache, so the host can be rebuilt after
        // destroyReactHost().
        JSBundleLoader bundleLoader
            = JSBundleLoader.createAssetLoader(app, "assets://index.android.bundle", true);

        DefaultReactHostDelegate delegate = new DefaultReactHostDelegate(
            "index.android",        /* jsMainModulePath */
            bundleLoader,
            getReactNativePackages(),
            new HermesInstance(),
            null,                   /* bindingsInstaller */
            e -> {
                // Backport of react-native #57181: ignore the benign missing-viewState
                // mount race. Remove once RN ships the fix.
                if (isMissingViewStateException(e)) {
                    JitsiMeetLogger.w("ReactHost ignoring missing-viewState mount race: " + e.getMessage());
                } else {
                    JitsiMeetLogger.e(e, "ReactHost internal exception");
                    throw new RuntimeException(e);
                }
                return kotlin.Unit.INSTANCE;
            },                      /* exceptionHandler */
            new DefaultTurboModuleManagerDelegate.Builder());

        ComponentFactory componentFactory = new ComponentFactory();
        DefaultComponentsRegistry.register(componentFactory);

        reactHost = new ReactHostImpl(
            app,
            delegate,
            componentFactory,
            true,                   /* allowPackagerServerAccess */
            BuildConfig.DEBUG       /* useDevSupport */);

        reactHost.start();
    }

    /**
     * Starts the React Native runtime if it's not already running.
     */
    static void instantiateReactNative() {
        if (application == null) {
            JitsiMeetLogger.w(TAG + " Cannot instantiate RN, SDK is not initialized");
            return;
        }

        initReactHost(application);
    }

    /**
     * Destroys the React Native runtime and drops the host reference so a
     * new one can be built. Teardown is asynchronous.
     */
    static void destroyReactHost() {
        if (reactHost == null) {
            return;
        }

        JitsiMeetLogger.d(TAG + " destroying RN");

        reactHost.invalidate();
        reactHost = null;
    }

    // Matches the missing-viewState mount race fixed upstream in react-native #57181.
    private static boolean isMissingViewStateException(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof RetryableMountingLayerException
                    && t.getMessage() != null
                    && t.getMessage().contains("Unable to find viewState")) {
                return true;
            }
        }
        return false;
    }
}
