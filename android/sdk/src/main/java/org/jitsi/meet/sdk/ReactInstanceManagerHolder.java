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

import android.app.Activity;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.jscexecutor.JSCExecutorFactory;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.oney.WebRTCModule.EglUtils;
import com.oney.WebRTCModule.WebRTCModuleOptions;
import com.oney.WebRTCModule.webrtcutils.H264AndSoftwareVideoDecoderFactory;
import com.oney.WebRTCModule.webrtcutils.H264AndSoftwareVideoEncoderFactory;

import org.devio.rn.splashscreen.SplashScreenModule;
import org.webrtc.EglBase;

import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

class ReactInstanceManagerHolder {
    private static final String TAG = ReactInstanceManagerHolder.class.getSimpleName();

    /**
     * FIXME (from linter): Do not place Android context classes in static
     * fields (static reference to ReactInstanceManager which has field
     * mApplicationContext pointing to Context); this is a memory leak (and
     * also breaks Instant Run).
     *
     * React Native bridge. The instance manager allows embedding applications
     * to create multiple root views off the same JavaScript bundle.
     */
    private static ReactInstanceManager reactInstanceManager;

    private static List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> nativeModules
            = new ArrayList<>(Arrays.<NativeModule>asList(
                new AndroidSettingsModule(reactContext),
                new AppInfoModule(reactContext),
                new AudioModeModule(reactContext),
                new DropboxModule(reactContext),
                new ExternalAPIModule(reactContext),
                new JavaScriptSandboxModule(reactContext),
                new LocaleDetector(reactContext),
                new LogBridgeModule(reactContext),
                new SplashScreenModule(reactContext),
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
            new com.corbt.keepawake.KCKeepAwakePackage(),
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
            new com.rnimmersivemode.RNImmersiveModePackage(),
            new com.swmansion.rnscreens.RNScreensPackage(),
            new com.zmxv.RNSound.RNSoundPackage(),
            new com.th3rdwave.safeareacontext.SafeAreaContextPackage(),
            new com.horcrux.svg.SvgPackage(),
            new org.wonday.orientation.OrientationPackage(),
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
            Constructor constructor = amplitudePackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
            Log.d(TAG, "Not loading AmplitudeReactNativePackage");
        }

        // GiphyReactNativeSdkPackage
        try {
            Class<?> giphyPackageClass = Class.forName("com.giphyreactnativesdk.GiphyReactNativeSdkPackage");
            Constructor constructor = giphyPackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
            Log.d(TAG, "Not loading GiphyReactNativeSdkPackage");
        }

        // RNGoogleSignInPackage
        try {
            Class<?> googlePackageClass = Class.forName("com.reactnativegooglesignin.RNGoogleSigninPackage");
            Constructor constructor = googlePackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
            Log.d(TAG, "Not loading RNGoogleSignInPackage");
        }

        return packages;
    }

    static JSCExecutorFactory getReactNativeJSFactory() {
        // Keep on using JSC, the jury is out on Hermes.
        return new JSCExecutorFactory("", "");
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
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            ReactContext reactContext
                = reactInstanceManager.getCurrentReactContext();

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
     * is to be retrieved from the {@link #reactInstanceManager}.
     * @param <T> the module's type.
     * @return {@link NativeModule} instance for given interface type or
     * {@code null} if no instance for this interface is available, or if
     * {@link #reactInstanceManager} has not been initialized yet.
     */
    static <T extends NativeModule> T getNativeModule(
            Class<T> nativeModuleClass) {
        ReactContext reactContext
            = reactInstanceManager != null
                ? reactInstanceManager.getCurrentReactContext() : null;

        return reactContext != null
                ? reactContext.getNativeModule(nativeModuleClass) : null;
    }

    /**
     * Gets the current {@link Activity} linked to React Native.
     *
     * @return An activity attached to React Native.
     */
    static Activity getCurrentActivity() {
        ReactContext reactContext
            = reactInstanceManager != null
            ? reactInstanceManager.getCurrentReactContext() : null;
        return reactContext != null ? reactContext.getCurrentActivity() : null;
    }

    static ReactInstanceManager getReactInstanceManager() {
        return reactInstanceManager;
    }

    /**
     * Internal method to initialize the React Native instance manager. We
     * create a single instance in order to load the JavaScript bundle a single
     * time. All {@code ReactRootView} instances will be tied to the one and
     * only {@code ReactInstanceManager}.
     *
     * @param activity {@code Activity} current running Activity.
     */
    static void initReactInstanceManager(Activity activity) {
        if (reactInstanceManager != null) {
            return;
        }

        // Initialize the WebRTC module options.
        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();

        EglBase.Context eglContext = EglUtils.getRootEglBaseContext();

        options.videoDecoderFactory = new H264AndSoftwareVideoDecoderFactory(eglContext);
        options.videoEncoderFactory = new H264AndSoftwareVideoEncoderFactory(eglContext);

        Log.d(TAG, "initializing RN with Activity");

        reactInstanceManager
            = ReactInstanceManager.builder()
                .setApplication(activity.getApplication())
                .setCurrentActivity(activity)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModulePath("index.android")
                .setJavaScriptExecutorFactory(getReactNativeJSFactory())
                .addPackages(getReactNativePackages())
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();
    }
}
