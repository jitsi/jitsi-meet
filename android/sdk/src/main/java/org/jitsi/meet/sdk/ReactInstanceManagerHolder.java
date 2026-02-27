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

import android.annotation.SuppressLint;
import android.app.Application;

import androidx.annotation.Nullable;

import com.facebook.react.ReactHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.modules.core.DeviceEventManagerModule;
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

class ReactInstanceManagerHolder {
    private static final String TAG = ReactInstanceManagerHolder.class.getSimpleName();

    /**
     * ReactHost is the new architecture replacement for ReactInstanceManager.
     * It manages the React Native runtime in bridgeless (Fabric + TurboModules) mode.
     */
    private static ReactHost reactHost;

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
                new ProximityModule(reactContext),
                new org.jitsi.meet.sdk.net.NAT64AddrInfoModule(reactContext)));

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
            new com.zmxv.RNSound.RNSoundPackage(),
            new com.th3rdwave.safeareacontext.SafeAreaContextPackage(),
            new com.horcrux.svg.SvgPackage(),
            new org.wonday.orientation.OrientationPackage(),
            new com.splashview.SplashViewPackage(),
            new com.worklets.WorkletsCorePackage(),
            new ReactPackageAdapter() {
                @Override
                public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
                    return ReactInstanceManagerHolder.createNativeModules(reactContext);
                }
                @Override
                public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
                    return ReactInstanceManagerHolder.createViewManagers(reactContext);
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

    static ReactHost getReactHost() {
        return reactHost;
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
            @SuppressLint("VisibleForTests") ReactContext reactContext
                = reactHost.getCurrentReactContext();

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
     * is to be retrieved from the {@link #reactHost}.
     * @param <T> the module's type.
     * @return {@link NativeModule} instance for given interface type or
     * {@code null} if no instance for this interface is available, or if
     * {@link #reactHost} has not been initialized yet.
     */
    static <T extends NativeModule> T getNativeModule(
            Class<T> nativeModuleClass) {
        @SuppressLint("VisibleForTests") ReactContext reactContext
            = reactHost != null
                ? reactHost.getCurrentReactContext() : null;

        return reactContext != null
                ? reactContext.getNativeModule(nativeModuleClass) : null;
    }

    /**
     * Internal method to initialize the React Native host. We create a single
     * instance in order to load the JavaScript bundle a single time. All
     * {@code ReactSurface} instances will be tied to the one and only
     * {@code ReactHost}.
     *
     * @param app {@code Application}
     */
    static void initReactInstanceManager(Application app) {
        if (reactHost != null) {
            return;
        }

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

        JitsiMeetLogger.d(TAG, "initializing RN");

        // In RN 0.76+, ReactInstanceManager is replaced by ReactHost.
        // DefaultReactHost.getDefaultReactHost creates a ReactHostImpl using the
        // new bridgeless architecture (Fabric + TurboModules).
        reactHost = DefaultReactHost.getDefaultReactHost(
            app,
            getReactNativePackages(),
            "index.android",            // jsMainModulePath
            "index.android.bundle",     // jsBundleAssetPath
            null,                       // jsBundleFile (filesystem path, null = use assets)
            new HermesInstance(),       // JSRuntimeFactory
            BuildConfig.DEBUG,          // isDev
            Collections.emptyList(),    // cxxReactPackageProviders
            e -> {
                JitsiMeetLogger.e(e, "React exception");
                return kotlin.Unit.INSTANCE;
            },
            null                        // BindingsInstaller
        );
    }
}
