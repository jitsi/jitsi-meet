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
import androidx.annotation.Nullable;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.webrtc.Logging;

import java.lang.reflect.Method;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;

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

    // JitsiMeetActivity overrides
    //

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        JitsiMeet.showSplashScreen(this);

        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        options.loggingSeverity = Logging.Severity.LS_ERROR;

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
            .setServerURL(buildURL("https://meet.jit.si/test0988test"))
            .setFeatureFlag("welcomepage.enabled", true)
            .setFeatureFlag("server-url-change.enabled", !configurationByRestrictions)
            .setConfigOverride("customToolbarButtons", getCustomToolbarButtons())
            .setConfigOverride("toolbarButtons", getToolbarButtons())
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

    private @Nullable URL buildURL(String urlStr) {
        try {
            return new URL(urlStr);
        } catch (Exception e) {
            return null;
        }
    }

     private static @NonNull ArrayList<Bundle> getCustomToolbarButtons() {
         ArrayList<Bundle> customToolbarButtons = new ArrayList<>();

         Bundle firstCustomButton = new Bundle();
         Bundle secondCustomButton = new Bundle();
         Bundle thirdCustomButton = new Bundle();
         Bundle fourthCustomButton = new Bundle();
         Bundle fifthCustomButton = new Bundle();

         firstCustomButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFISURBVHgBxVWBcYMwDJQ7QbuBu4FHcDfoBvEGZQOSicgGdIPQCWADRnClQ76qYFE7Vy5/J3yRXpKlCAFwMEwJKcbo8CCxrJpQBmPMAPcCgz6jtChz1DGifBC3NrhnZ0KPElCsrIh1nUjkS4OfapwosbjM6S+yZ+Ktpmxu5419/R5pZKnraYk/Khu+gYU7ITpwTjojjCMeXzh675ozLKNKuCJvUng98dD+IpWOMwfFqY1btAo3sN3tK39sNurwO/xAv59Yb+mhvJnZljE2FxKtszLBYUgJJnooE7S3b65rhWjzJBOkIH7tgCV/4nGBLS7KJDkZU47pDMuGfMs4perS/zFw4hyvg2VMX9eGszYZpRAT1OSMx64KJh237AQ5vXRjLNhL8fe3I0AJVk4dJ3XCblnXi8t4qAGX3YhEOcw8HGo7H/fR/y98AzFrGjU3gjYAAAAAAElFTkSuQmCC");
         firstCustomButton.putString("id", "record");

         secondCustomButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFRSURBVHgB1VTRcYMwDBWdgBG8QTMCGzQbNBuUDWCDsgHZICPQDdINSCcgncCV7p5bVXHADpePvDsdRBbvyX5yiO6MIqXIe+/4UXE4pD4liqI40RowccUx+OsYIH4TeQOSiaPVRPy+4dhxjKhpKAeKfM9RztSVqBHUlALpFB8cKBFSi29cSvEeW3dGdMBxSfRmvUR+uSl00hvyEQSdamDUx4e1ae5Ig3mCF/Ohj+xI0KrcDrmN5nwyGkH9W+WeOT70zONd7oImOxmOqMAZT6dyX4bINmN/n+kalFmdylVh1nE0UvOO3KuqE28mWgJGbjIGtv4SrVoPg9CnCETvAfJviCrS1L9BWBKpw7Ek1DZ2R6kiYTy3MzVb1HSUC5h5hB8usu6wdqRbocwbjek672gN/N/tHlTuELu1a0R+TVempv09Z4h06g7km5ooUmeP48PjBzBGLGGSG2WSAAAAAElFTkSuQmCC");
         secondCustomButton.putString("id", "location");

         thirdCustomButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAErSURBVHgBvZWNEYIwDIWD5yCOwAiwAW6AG7gBMAmM4AawAW6gGzhCTc7Ahf6dbdF3J7208X1tWgrAj5XJQClVYFNAmu5Zlt2MXjTv1X7qdfOKB1pIFHmwV2F0QqDIhP9baf3rZI8QKS5DLeIBa3/R8w4QZ16xeYemdFA6ijdlSQGgcnqgdytbsJzAWMBED5xxI1vUbM12bTJ25eAQ1Vw7moMYWzf54DGgWc1idhthWWpszvCpf8kxfLUCMuVZjNw2ECC5AgMgzFs5JiGc88DfKQigmzvGl5yXC+IDGOauHDJmgAHxAazmWt5VxFaIdw9CZYNIQOyLtgqP5xObksNRL1cywAbZHWCBGICJHirwhXJAls/l9l5S5t2SomGFahC653NI04QrmeBfegPEpC4OSSpfkQAAAABJRU5ErkJggg==");
         thirdCustomButton.putString("id", "screenshot");

         fourthCustomButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADSSURBVHgB7VTRCcJADE3BAeoGHcFNdAPdwG7QbqBO0G7gCHaD4gR1BJ0gvsOAIl5jAkd/+uDRwr33cuTuQjQjFZi5BStKBSnAkxdZKAEFPmtwGZHcwDtYQ/vIsuxIht3t2YazJXwnptCCfES3FV0/pvtlvICDovGFi3kAG0XTu8LFHFq0UjS5KzwWpqwXYEnO8CY0WtGUch4FecKBWtG12qVwhcs5HP7ZxLexYhuiLzg2Kq4f/yd6jYMYOoyIjqzg92v23XVrEUoFhG/YMshmWPEEwndJv9jtUaIAAAAASUVORK5CYII=");
         fourthCustomButton.putString("id", "swap-camera");

         fifthCustomButton.putString("backgroundColor", "red");
         fifthCustomButton.putString("icon", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACESURBVHgB7ZRLDoAgDESL8b7iCfQIXtUTjDSyYMGnhe7gJSTGTOcl2kC0mBMARziXMu+leR7w+GlKOBOzN2nggZaku1wiGS6vSczKcxLz8oxEVb6RHBSex0k/CwTb1V2evLOR1H7osASCbemWQLGKiSR7F+2FuTec0zn3UIOQYQEtJuYDedv/MgzzIYUAAAAASUVORK5CYII=");
         fifthCustomButton.putString("id", "close");

         customToolbarButtons.add(firstCustomButton);
         customToolbarButtons.add(secondCustomButton);
         customToolbarButtons.add(thirdCustomButton);
         customToolbarButtons.add(fourthCustomButton);
         customToolbarButtons.add(fifthCustomButton);

         return customToolbarButtons;
     }

     private String[] getToolbarButtons() {
         return new String[]{"record", "location", "screenshot", "swap-camera", "close"};
     }

    protected void onCustomButtonPressed(HashMap<String, Object> extraData) {
        JitsiMeetLogger.i("Custom button pressed: " + extraData);
        if (extraData != null && extraData.containsKey("id")) {
            String buttonId = (String) extraData.get("id");
            if ("record".equals(buttonId)) {
                Bundle extraMetadata = new Bundle();
                extraMetadata.putString("call_id", interactionId);

                JitsiMeetLogger.i("Extra Metadata: " + extraMetadata);

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
            }
        }
    }
}
