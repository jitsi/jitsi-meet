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

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import com.amplitude.api.Amplitude;
import com.facebook.react.module.annotations.ReactModule;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Implements the react-native module for the Amplitude integration.
 */
@ReactModule(name = AmplitudeModule.NAME)
class AmplitudeModule
        extends ReactContextBaseJavaModule {

    public static final String NAME = "Amplitude";
    public static final String JITSI_PREFERENCES = "jitsi-preferences";
    public static final String AMPLITUDE_DEVICE_ID_KEY = "amplitudeDeviceId";

    public AmplitudeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Initializes the Amplitude SDK.
     *
     * @param instanceName The name of the Amplitude instance. Should
     * be used only for multi-project logging.
     * @param apiKey The API_KEY of the Amplitude project.
     */
    @ReactMethod
    @SuppressLint("HardwareIds")
    public void init(String instanceName, String apiKey) {
        Amplitude.getInstance(instanceName).initialize(getCurrentActivity(), apiKey);

        // Set the device ID to something consistent.
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(JITSI_PREFERENCES, Context.MODE_PRIVATE);
        String android_id = sharedPreferences.getString(AMPLITUDE_DEVICE_ID_KEY, "");
        if (!TextUtils.isEmpty(android_id)) {
            Amplitude.getInstance(instanceName).setDeviceId(android_id);
        } else {
            String amplitudeId = Amplitude.getInstance(instanceName).getDeviceId();
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString(JITSI_PREFERENCES, amplitudeId).apply();
        }
    }

    /**
     * Sets the user ID for an Amplitude instance.
     *
     * @param instanceName The name of the Amplitude instance.
     * @param userId The new value for the user ID.
     */
    @ReactMethod
    public void setUserId(String instanceName, String userId) {
            Amplitude.getInstance(instanceName).setUserId(userId);
    }

    /**
     * Sets the user properties for an Amplitude instance.
     *
     * @param instanceName The name of the Amplitude instance.
     * @param userProps JSON string with user properties to be set.
     */
    @ReactMethod
    public void setUserProperties(String instanceName, ReadableMap userProps) {
        if (userProps != null) {
            Amplitude.getInstance(instanceName).setUserProperties(
                    new JSONObject(userProps.toHashMap()));
        }
    }

    /**
     * Log an analytics event.
     *
     * @param instanceName The name of the Amplitude instance.
     * @param eventType The event type.
     * @param eventPropsString JSON string with the event properties.
     */
    @ReactMethod
    public void logEvent(String instanceName, String eventType, String eventPropsString) {
        try {
            JSONObject eventProps = new JSONObject(eventPropsString);
            Amplitude.getInstance(instanceName).logEvent(eventType, eventProps);
        } catch (JSONException e) {
            JitsiMeetLogger.e(e, "Error logging event");
        }
    }

    @Override
    public String getName() {
        return NAME;
    }
}
