/*
 * Copyright @ 2018-present 8x8, Inc.
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

/*
 * Based on https://github.com/DylanVann/react-native-locale-detector
 */

package org.jitsi.meet.sdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import android.os.LocaleList;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Module which provides information about the system locale and notifies JS
 * when the system locale changes.
 */
@ReactModule(name = LocaleDetector.NAME)
class LocaleDetector extends ReactContextBaseJavaModule implements LifecycleEventListener {

    public static final String NAME = "LocaleDetector";
    private static final String LOCALE_CHANGED_EVENT = "localeChanged";

    private String lastLocale;
    private boolean isReceiverRegistered = false;

    private final BroadcastReceiver localeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            checkLocaleChange();
        }
    };

    public LocaleDetector(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void initialize() {
        super.initialize();
        getReactApplicationContext().addLifecycleEventListener(this);
        registerLocaleReceiver();
    }

    @Override
    public void invalidate() {
        unregisterLocaleReceiver();
        getReactApplicationContext().removeLifecycleEventListener(this);
        super.invalidate();
    }

    private void registerLocaleReceiver() {
        if (!isReceiverRegistered) {
            IntentFilter filter = new IntentFilter(Intent.ACTION_LOCALE_CHANGED);
            Context context = getReactApplicationContext();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(localeReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                context.registerReceiver(localeReceiver, filter);
            }
            isReceiverRegistered = true;
        }
    }

    private void unregisterLocaleReceiver() {
        if (isReceiverRegistered) {
            try {
                getReactApplicationContext().unregisterReceiver(localeReceiver);
            } catch (Exception e) {
                // Ignore if already unregistered
            }
            isReceiverRegistered = false;
        }
    }

    private synchronized void checkLocaleChange() {
        Context context = getReactApplicationContext();
        String currentLocale = getCurrentLocaleTag(context);

        if (lastLocale != null && !lastLocale.equals(currentLocale)) {
            lastLocale = currentLocale;
            emitLocaleChanged(currentLocale);
        } else if (lastLocale == null) {
            lastLocale = currentLocale;
        }
    }

    private void emitLocaleChanged(String locale) {
        ReactApplicationContext reactContext = getReactApplicationContext();

        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(LOCALE_CHANGED_EVENT, locale);
        }
    }

    /**
     * Gets the language tag for the current system locale.
     * Configuration.locale was deprecated in API 24; on Android N+, getLocales()
     * reflects system locale changes dynamically.
     *
     * @param context the application context
     * @return a BCP 47 language tag (e.g. "en-US")
     */
    private String getCurrentLocaleTag(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            LocaleList locales = LocaleList.getDefault();

            if (locales != null && !locales.isEmpty()) {
                return locales.get(0).toLanguageTag();
            }

            Configuration systemConfig = Resources.getSystem().getConfiguration();

            if (systemConfig.getLocales() != null && !systemConfig.getLocales().isEmpty()) {
                return systemConfig.getLocales().get(0).toLanguageTag();
            }
        }

        Locale defaultLocale = Locale.getDefault();

        if (defaultLocale != null) {
            return defaultLocale.toLanguageTag();
        }

        Configuration config = context.getResources().getConfiguration();
        Locale locale = config.locale != null ? config.locale : Locale.getDefault();

        return locale.toLanguageTag();
    }

    /**
     * Gets a {@code Map} of constants this module exports to JS. Supports JSON
     * types.
     *
     * @return a {@link Map} of constants this module exports to JS
     */
    @Override
    public Map<String, Object> getConstants() {
        Context context = getReactApplicationContext();
        String locale = getCurrentLocaleTag(context);

        lastLocale = locale;
        HashMap<String, Object> constants = new HashMap<>();

        constants.put("locale", locale);

        return constants;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void onHostResume() {
        checkLocaleChange();
    }

    @Override
    public void onHostPause() {
        // No-op
    }

    @Override
    public void onHostDestroy() {
        unregisterLocaleReceiver();
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built-in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built-in Event Emitter Calls.
    }
}
