/*
 * Copyright @ 2019-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
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
import android.support.annotation.Nullable;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.devsupport.DevInternalSettings;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.lang.reflect.Constructor;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class ReactInstanceManagerHolder {
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

    private static List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> nativeModules
            = new ArrayList<>(Arrays.<NativeModule>asList(
                new AndroidSettingsModule(reactContext),
                new AppInfoModule(reactContext),
                new AudioModeModule(reactContext),
                new DropboxModule(reactContext),
                new ExternalAPIModule(reactContext),
                new LocaleDetector(reactContext),
                new PictureInPictureModule(reactContext),
                new ProximityModule(reactContext),
                new WiFiStatsModule(reactContext),
                new org.jitsi.meet.sdk.net.NAT64AddrInfoModule(reactContext)));

        if (AudioModeModule.useConnectionService()) {
            nativeModules.add(new RNConnectionService(reactContext));
        }

        try {
            Class<?> amplitudeModuleClass = Class.forName("AmplitudeModule");
            Constructor constructor = amplitudeModuleClass.getConstructor(ReactApplicationContext.class);
            nativeModules.add((NativeModule)constructor.newInstance(reactContext));
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
        }

        return nativeModules;
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

    static ReactInstanceManager getReactInstanceManager() {
        return reactInstanceManager;
    }

    /**
     * Internal method to initialize the React Native instance manager. We
     * create a single instance in order to load the JavaScript bundle a single
     * time. All {@code ReactRootView} instances will be tied to the one and
     * only {@code ReactInstanceManager}.
     *
     * @param application {@code Application} instance which is running.
     */
    static void initReactInstanceManager(Application application) {
        if (reactInstanceManager != null) {
            return;
        }

        List<ReactPackage> packages
            = new ArrayList<>(Arrays.asList(
                new com.BV.LinearGradient.LinearGradientPackage(),
                new com.calendarevents.CalendarEventsPackage(),
                new com.corbt.keepawake.KCKeepAwakePackage(),
                new com.dylanvann.fastimage.FastImageViewPackage(),
                new com.facebook.react.shell.MainReactPackage(),
                new com.oblador.vectoricons.VectorIconsPackage(),
                new com.ocetnik.timer.BackgroundTimerPackage(),
                new com.oney.WebRTCModule.WebRTCModulePackage(),
                new com.reactnativecommunity.webview.RNCWebViewPackage(),
                new com.rnimmersive.RNImmersivePackage(),
                new com.zmxv.RNSound.RNSoundPackage(),
                new ReactPackageAdapter() {
                    @Override
                    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
                        return ReactInstanceManagerHolder.createNativeModules(reactContext);
                    }
                }));

        try {
            Class<?> googlePackageClass = Class.forName("co.apptailor.googlesignin.RNGoogleSigninPackage");
            Constructor constructor = googlePackageClass.getConstructor();
            packages.add((ReactPackage)constructor.newInstance());
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
        }

        reactInstanceManager
            = ReactInstanceManager.builder()
                .setApplication(application)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModulePath("index.android")
                .addPackages(packages)
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();

        // Disable delta updates on Android, they have caused trouble.
        DevInternalSettings devSettings
            = (DevInternalSettings)reactInstanceManager.getDevSupportManager().getDevSettings();
        if (devSettings != null) {
            devSettings.setBundleDeltasEnabled(false);
        }
    }
}
