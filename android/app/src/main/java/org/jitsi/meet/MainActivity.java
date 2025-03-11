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

package org.jitsi.meet;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.RestrictionEntry;
import android.content.RestrictionsManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.view.KeyEvent;

import androidx.annotation.NonNull;
//import androidx.annotation.Nullable;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

//import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.log.JitsiMeetLogger;
//import org.webrtc.Logging;

import java.lang.reflect.Method;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * The one and only Activity that the Jitsi Meet app needs. The
 * {@code Activity} is launched in {@code singleTask} mode, so it will be
 * created upon application initialization and there will be a single instance
 * of it. Further attempts at launching the application once it was already
 * launched will result in {@link MainActivity#onNewIntent(Intent)} being called.
 */
public class MainActivity extends JitsiMeetActivity {
    /**
     * The request code identifying requests for the permission to draw on top
     * of other apps. The value must be 16-bit and is arbitrarily chosen here.
     */
    private static final int OVERLAY_PERMISSION_REQUEST_CODE
        = (int) (Math.random() * Short.MAX_VALUE);

    /**
     * ServerURL configuration key for restriction configuration using {@link android.content.RestrictionsManager}
     */
    public static final String RESTRICTION_SERVER_URL = "SERVER_URL";

    private static final String TAG = JitsiMeetActivity.class.getSimpleName();

    private String interactionId;

    /**
     * Broadcast receiver for restrictions handling
     */
    private BroadcastReceiver broadcastReceiver;

    /**
     * Flag if configuration is provided by RestrictionManager
     */
    private boolean configurationByRestrictions = false;

    /**
     * Default URL as could be obtained from RestrictionManager
     */
    private String defaultURL;

    // Static ArrayList to hold all custom toolbar buttons
    private static final ArrayList<Bundle> ALL_CUSTOM_TOOLBAR_BUTTONS = new ArrayList<>();

    // Static initialization block to create all buttons once
    static {
        // Create the record button
        Bundle recordButton = new Bundle();
        recordButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFISURBVHgBxVWBcYMwDJQ7QbuBu4FHcDfoBvEGZQOSicgGdIPQCWADRnClQ76qYFE7Vy5/J3yRXpKlCAFwMEwJKcbo8CCxrJpQBmPMAPcCgz6jtChz1DGifBC3NrhnZ0KPElCsrIh1nUjkS4OfapwosbjM6S+yZ+Ktpmxu5419/R5pZKnraYk/Khu+gYU7ITpwTjojjCMeXzh675ozLKNKuCJvUng98dD+IpWOMwfFqY1btAo3sN3tK39sNurwO/xAv59Yb+mhvJnZljE2FxKtszLBYUgJJnooE7S3b65rhWjzJBOkIH7tgCV/4nGBLS7KJDkZU47pDMuGfMs4perS/zFw4hyvg2VMX9eGszYZpRAT1OSMx64KJh237AQ5vXRjLNhL8fe3I0AJVk4dJ3XCblnXi8t4qAGX3YhEOcw8HGo7H/fR/y98AzFrGjU3gjYAAAAAAElFTkSuQmCC");
        recordButton.putString("id", "record");

        // Create the close button
        Bundle closeButton = new Bundle();
        closeButton.putString("id", "close");
        closeButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAO5SURBVHic7ZrvURsxEMWfMvkepwKug7gDnApwB7iDkAogFUAqwB3EVMC5AtwBpgJMBS8fpBubG+lO0snGHt5v5obxv5X2Ie2u9g4QQgghhBBCCCGEEEIIIYQQQgghhBCfE/NRA5McAfjhXo4BjHY+br8OsQKw2Xldu78vxpj14ElmsHdBSY5hhasATGCFGu97XMfaXSt3rY0xy30OWFxQkuewwjXXMbKCXc01gKUxZtPz/WgGC+q27gWAKbYr8NRYuOthqLjZgpKsAFzDCnmKIvrYwAr71xizyjGQLCjJCayQJbfzC2ysa2gnmxC7c9hNciWoAfwxxtS939whWlC3tW8BzBIn1rDE+ySxSZ1sLC4RjvA+CY4BfMswNwfwu2ScBckxyWfGsyY5J3nlnDsKSFYkZ25u6wR/nov54cR8jRTx5pgE7MP5dhUp7utg39x/tE/MOW1cPWlITpwvfaJWQwZ57DC+GGT8SHGrtu7w+zHX8KTDaG5iOhloY205/90K/JRiNpCcpq7SYNlEkp63H4wx0yKz9Y9ZATiDLXcqd/loyq8ae26EkLwD8Mvz0ffoUqpjuxfP4CQvSN4yrSxr8+RsnO9hflVgzPhETFv+tCm2CtwkrweKGOLZ2S6WMOkvq25SDPjKh0WBiY1oV9KhuKc94Q2dty/r3/m++yVgw/ffzWoW7EyqAvAE4GqInURmAEqccnxHZK/NrwMHSuEfwkmmTdMsCZ31m6R1FmFrBOCe5M+i5/EABxGU5BW6u/Rv2PYk61jH3XaewLYQpwg3P8awOyM+7pUkEDOyJ8Nw8qlZsK6lLcZDp5znAXZ9STq+U8aCSYn2KOdjb7GUtuHhIyuW0n/Imfu+G0pKvhIpN1t66zVjjDdLlsDZfoudSwQ+371lZIqguUWzz4mHTFsp+LZk7inP53uSoN4SiYltOtpS6cLz0V469RFjnDOx4O8IE2llJMlNbNzY+c05yUva4v0pEMeY6lQODB8Zye1R9ZI9x1WSd57fB6uQrrJpAeCy9d4lyVdsb6A19266Ghltlod4qsMYsya5hH+7NveYAAC0faCm4bLB+9XX1gCw2qTB7n7oEA7W3T86H9jduc7h4L1UdjeKc8iP/7RxyBdLU1mR3FsfNcKPqZvDUDbsqWV778s7AwvEnZsbltg+oFV/1JNwbWiT4QTbGJpSCr4AmPU9S5DyoMMM26ZEQ/OERxPI18ciXixO5ArhBLuGXRSdFY4QQgghhBBCCCGEEEIIIYQQQgghhPjs/AeC/qR/mZe1AQAAAABJRU5ErkJggg==");
        closeButton.putString("backgroundColor", "red");

        // Add buttons to the static list
        ALL_CUSTOM_TOOLBAR_BUTTONS.add(recordButton);
        ALL_CUSTOM_TOOLBAR_BUTTONS.add(closeButton);
    }

    // Initial toolbar buttons configuration
    private static final String[] INITIAL_TOOLBAR_BUTTONS = {"record", "microphone", "camera", "chat", "hangup"};

    // Toolbar buttons configuration when recording
    private static final String[] RECORDING_TOOLBAR_BUTTONS = {"close", "microphone", "camera", "chat", "hangup"};

    // JitsiMeetActivity overrides
    //

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        JitsiMeet.showSplashScreen(this);

//        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
//        options.loggingSeverity = Logging.Severity.LS_ERROR;

        // Initialize interaction ID
        interactionId = generateInteractionId();

        super.onCreate(null);
    }

    /**
     * Generates a unique interaction ID using timestamp and random number.
     *
     * @return A unique interaction ID string
     */
    private String generateInteractionId() {
        long timestamp = System.currentTimeMillis();
        int random = (int) (Math.random() * 10000);
        return "interaction_" + timestamp + "_" + random;
    }

    @Override
    protected boolean extraInitialize() {
        Log.d(this.getClass().getSimpleName(), "LIBRE_BUILD="+BuildConfig.LIBRE_BUILD);

        // Setup Crashlytics and Firebase Dynamic Links
        // Here we are using reflection since it may have been disabled at compile time.
        try {
            Class<?> cls = Class.forName("org.jitsi.meet.GoogleServicesHelper");
            Method m = cls.getMethod("initialize", JitsiMeetActivity.class);
            m.invoke(null, this);
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
        }

        // In Debug builds React needs permission to write over other apps in
        // order to display the warning and error overlays.
        if (BuildConfig.DEBUG) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent
                    = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));

                startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);

                return true;
            }
        }

        return false;
    }

    @Override
    protected void initialize() {
        broadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                // As new restrictions including server URL are received,
                // conference should be restarted with new configuration.
                leave();
                recreate();
            }
        };
        registerReceiver(broadcastReceiver,
            new IntentFilter(Intent.ACTION_APPLICATION_RESTRICTIONS_CHANGED));

        resolveRestrictions();
        setJitsiMeetConferenceDefaultOptions();
        super.initialize();
    }

    @Override
    public void onDestroy() {
        if (broadcastReceiver != null) {
            unregisterReceiver(broadcastReceiver);
            broadcastReceiver = null;
        }

        super.onDestroy();
    }

    private void setJitsiMeetConferenceDefaultOptions() {

        // Set default options
        JitsiMeetConferenceOptions defaultOptions
            = new JitsiMeetConferenceOptions.Builder()
            .setRoom("https://meet.jit.si/test0988test")
            .setConfigOverride("customToolbarButtons", getCustomToolbarButtons())
            .setConfigOverride("toolbarButtons", getToolbarButtons())
            .setConfigOverride("recordingService", getRecordingService())
            .setFeatureFlag("welcomepage.enabled", true)
            .setFeatureFlag("server-url-change.enabled", !configurationByRestrictions)
            .build();
        JitsiMeet.setDefaultConferenceOptions(defaultOptions);
    }

    private void resolveRestrictions() {
        RestrictionsManager manager =
            (RestrictionsManager) getSystemService(Context.RESTRICTIONS_SERVICE);
        Bundle restrictions = manager.getApplicationRestrictions();
        Collection<RestrictionEntry> entries = manager.getManifestRestrictions(
            getApplicationContext().getPackageName());
        for (RestrictionEntry restrictionEntry : entries) {
            String key = restrictionEntry.getKey();
            if (RESTRICTION_SERVER_URL.equals(key)) {
                // If restrictions are passed to the application.
                if (restrictions != null &&
                    restrictions.containsKey(RESTRICTION_SERVER_URL)) {
                    defaultURL = restrictions.getString(RESTRICTION_SERVER_URL);
                    configurationByRestrictions = true;
                // Otherwise use default URL from app-restrictions.xml.
                } else {
                    defaultURL = restrictionEntry.getSelectedString();
                    configurationByRestrictions = false;
                }
            }
        }
    }

    // Activity lifecycle method overrides
    //

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
            if (Settings.canDrawOverlays(this)) {
                initialize();
                return;
            }

            throw new RuntimeException("Overlay permission is required when running in Debug mode.");
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    // ReactAndroid/src/main/java/com/facebook/react/ReactActivity.java
    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (BuildConfig.DEBUG && keyCode == KeyEvent.KEYCODE_MENU) {
            JitsiMeet.showDevOptions();
            return true;
        }

        return super.onKeyUp(keyCode, event);
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode);

        Log.d(TAG, "Is in picture-in-picture mode: " + isInPictureInPictureMode);
    }

    // Helper methods
    //

//    private @Nullable URL buildURL(String urlStr) {
//        try {
//            return new URL(urlStr);
//        } catch (Exception e) {
//            return null;
//        }
//    }

    private static @NonNull ArrayList<Bundle> getCustomToolbarButtons() {
        // Return a copy of the first button (record) initially
        ArrayList<Bundle> visibleButtons = new ArrayList<>();
        visibleButtons.add(ALL_CUSTOM_TOOLBAR_BUTTONS.get(0)); // Add record button
        return visibleButtons;
    }

    private String[] getToolbarButtons() {
        // Return the initial toolbar buttons configuration
        return INITIAL_TOOLBAR_BUTTONS;
    }

    private static Bundle getRecordingService() {
        Bundle recordingService = new Bundle();
        recordingService.putBoolean("enabled", true);
        recordingService.putBoolean("sharingEnabled", true);

        return recordingService;
    }

    @Override
    protected void onCustomButtonPressed(HashMap<String, Object> extraData) {
        JitsiMeetLogger.i("Custom button pressed: " + extraData);
        if (extraData != null && extraData.containsKey("id")) {
            String buttonId = (String) extraData.get("id");
            if ("record".equals(buttonId)) {
                // Generate a unique interaction ID for this recording session
                interactionId = generateInteractionId();

                Bundle extraMetadata = new Bundle();
                extraMetadata.putString("call_id", interactionId);

                JitsiMeetLogger.i("Starting recording with metadata: " + extraMetadata);

                // Start recording
                Intent startRecordingIntent = BroadcastIntentHelper.buildStartRecordingIntent(
                    BroadcastIntentHelper.RecordingMode.FILE,
                    null,
                    false,
                    null,
                    null,
                    null,
                    null,
                    extraMetadata,
                    false);
                LocalBroadcastManager.getInstance(this).sendBroadcast(startRecordingIntent);

                // Create a JSON object for the config
                Bundle configObj = new Bundle();

                // Update custom toolbar buttons to show close instead of record
                ArrayList customButtonsArray = new ArrayList();
                Bundle closeButtonJson = ALL_CUSTOM_TOOLBAR_BUTTONS.get(1); // Get close button
                customButtonsArray.add(closeButtonJson);
                configObj.putStringArrayList("customToolbarButtons", customButtonsArray);

                // Update toolbar buttons
                ArrayList toolbarButtonsArray = new ArrayList();
                for (String button : RECORDING_TOOLBAR_BUTTONS) {
                    toolbarButtonsArray.add(button);
                }
                configObj.putStringArrayList("toolbarButtons", toolbarButtonsArray);

                // Send the overwrite config intent
                Intent overwriteConfigIntent = BroadcastIntentHelper.buildOverwriteConfigIntent(configObj);
                JitsiMeetLogger.i("Updating buttons: " + configObj.toString());
                LocalBroadcastManager.getInstance(this).sendBroadcast(overwriteConfigIntent);
            } else if ("close".equals(buttonId)) {
                // Handle the close button press - stop recording
                JitsiMeetLogger.i("Stopping recording");
                Intent stopRecordingIntent = BroadcastIntentHelper.buildStopRecordingIntent(
                    BroadcastIntentHelper.RecordingMode.FILE,
                    false);
                LocalBroadcastManager.getInstance(this).sendBroadcast(stopRecordingIntent);

                // Create a JSON object for the config
                Bundle configObj = new Bundle();

                // Update custom toolbar buttons to show record instead of close
                ArrayList customButtonsArray = new ArrayList();
                Bundle recordButtonJson = ALL_CUSTOM_TOOLBAR_BUTTONS.get(0); // Get record button
                customButtonsArray.add(recordButtonJson);
                configObj.putStringArrayList("customToolbarButtons", customButtonsArray);

                // Update toolbar buttons
                ArrayList toolbarButtonsArray = new ArrayList();
                for (String button : INITIAL_TOOLBAR_BUTTONS) {
                    toolbarButtonsArray.add(button);
                }
                configObj.putStringArrayList("toolbarButtons", toolbarButtonsArray);

                // Send the overwrite config intent
                Intent overwriteConfigIntent = BroadcastIntentHelper.buildOverwriteConfigIntent(configObj);
                JitsiMeetLogger.i("Restoring original buttons: " + configObj.toString());
                LocalBroadcastManager.getInstance(this).sendBroadcast(overwriteConfigIntent);
            }
        }
    }

    // Helper method to convert a Bundle to a JSONObject
    private JSONObject bundleToJson(Bundle bundle) throws JSONException {
        JSONObject json = new JSONObject();
        for (String key : bundle.keySet()) {
            Object value = bundle.get(key);
            if (value != null) {
                json.put(key, value.toString());
            }
        }
        return json;
    }

    @Override
    protected void onRecordingStatusChanged(HashMap<String, Object> extraData) {
        JitsiMeetLogger.i("Recording status changed: " + extraData);
    }
}
