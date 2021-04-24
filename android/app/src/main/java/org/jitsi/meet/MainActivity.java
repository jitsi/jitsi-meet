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

import android.app.ActionBar;
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

import androidx.annotation.Nullable;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;

import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Collection;
import java.util.HashMap;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;

import java.net.MalformedURLException;
import java.net.URL;



import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;

import androidx.fragment.app.FragmentActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.BroadcastAction.*;
import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeetActivityDelegate;
import org.jitsi.meet.sdk.JitsiMeetActivityInterface;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.JitsiMeetView;

import java.net.MalformedURLException;
import java.net.URL;

public class MainActivity extends FragmentActivity implements JitsiMeetActivityInterface {
    private JitsiMeetView view;
    private boolean isMuted = false;

    @Override
    protected void onActivityResult(
        int requestCode,
        int resultCode,
        Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        JitsiMeetActivityDelegate.onActivityResult(
            this, requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        JitsiMeetActivityDelegate.onBackPressed();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        view = new JitsiMeetView(this);
        JitsiMeetConferenceOptions options = null;
        try {
            options = new JitsiMeetConferenceOptions.Builder()
                .setServerURL(new URL("https://meet.jit.si"))
                .setRoom("android-sdk-signzy")
                .setFeatureFlag("chat.enabled",false)
                .setFeatureFlag("meeting-name.enabled",false)
                .setFeatureFlag("raise-hand.enabled",false)
                .setFeatureFlag("video-mute.enabled",false)
                .setFeatureFlag("welcomepage.enabled",false)
                .setFeatureFlag("add-people.enabled",false)
                .setFeatureFlag("calendar.enabled",false)
                .setFeatureFlag("invite.enabled",false)
                .setFeatureFlag("toolbox.enabled",true)
                .setFeatureFlag("live-streaming.enabled",false)
                .setFeatureFlag("conference-timer.enabled",false)
                .setFeatureFlag("close-captions.enabled",false)
                .setFeatureFlag("video-share.enabled",false)
                .setFeatureFlag("filmstrip.enabled",true)
                .build();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        view.join(options);

        setContentView(view);
        Button btn = new Button(this);
        ViewGroup.LayoutParams lp = new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        btn.setLayoutParams(lp);
        view.addView(btn);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent muteBroadcastIntent = BroadcastIntentHelper.buildToggleCameraIntent();
                LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(muteBroadcastIntent);
            }
        });

//        getLayoutInflater().inflate(R.layout.activity_main,view,true);

    }

    public void onMuteBtnClick(View view) {
        isMuted = !isMuted;
        Intent muteBroadcastIntent = BroadcastIntentHelper.buildSetAudioMutedIntent(isMuted);
        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(muteBroadcastIntent);

    }

    public void onSwitchBtnClick(View view) {
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();

        view.dispose();
        view = null;

        JitsiMeetActivityDelegate.onHostDestroy(this);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        JitsiMeetActivityDelegate.onNewIntent(intent);
    }

    @Override
    public void onRequestPermissionsResult(
        final int requestCode,
        final String[] permissions,
        final int[] grantResults) {
        JitsiMeetActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    protected void onResume() {
        super.onResume();

        JitsiMeetActivityDelegate.onHostResume(this);
    }

    @Override
    protected void onStop() {
        super.onStop();

        JitsiMeetActivityDelegate.onHostPause(this);
    }

    @Override
    public void requestPermissions(String[] strings, int i, PermissionListener permissionListener) {

    }


}

//
//public class MainActivity extends AppCompatActivity {
//
//    private final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
//        @Override
//        public void onReceive(Context context, Intent intent) {
//            onBroadcastReceived(intent);
//        }
//    };
//
//    @Override
//    protected void onCreate(Bundle savedInstanceState) {
//        super.onCreate(savedInstanceState);
//        setContentView(R.layout.activity_jitsi_meet);
//
//        // Initialize default options for Jitsi Meet conferences.
//        URL serverURL;
//        try {
//            // When using JaaS, replace "https://meet.jit.si" with the proper serverURL
//            serverURL = new URL("https://meet.jit.si");
//        } catch (MalformedURLException e) {
//            e.printStackTrace();
//            throw new RuntimeException("Invalid server URL!");
//        }
//        JitsiMeetConferenceOptions defaultOptions
//            = new JitsiMeetConferenceOptions.Builder()
//            .setServerURL(serverURL)
//            // When using JaaS, set the obtained JWT here
//            //.setToken("MyJWT")
//            // Different features flags can be set
//            // .setFeatureFlag("toolbox.enabled", false)
//            // .setFeatureFlag("filmstrip.enabled", false)
//            .setWelcomePageEnabled(false)
//            .build();
//        JitsiMeet.setDefaultConferenceOptions(defaultOptions);
//
//        registerForBroadcastMessages();
//    }
//
//    @Override
//    protected void onDestroy() {
//        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastReceiver);
//
//        super.onDestroy();
//    }
//
//    public void onButtonClick(View v) {
//        EditText editText = findViewById(R.id.conferenceName);
//        String text = editText.getText().toString();
//
//        if (text.length() > 0) {
//            // Build options object for joining the conference. The SDK will merge the default
//            // one we set earlier and this one when joining.
//            JitsiMeetConferenceOptions options
//                = new JitsiMeetConferenceOptions.Builder()
//                .setRoom(text)
//                // Settings for audio and video
//                //.setAudioMuted(true)
//                //.setVideoMuted(true)
//                .build();
//            // Launch the new activity with the given options. The launch() method takes care
//            // of creating the required Intent and passing the options.
//            JitsiMeetActivity.launch(this, options);
//        }
//    }
//
//    private void registerForBroadcastMessages() {
//        IntentFilter intentFilter = new IntentFilter();
//
//        /* This registers for every possible event sent from JitsiMeetSDK
//           If only some of the events are needed, the for loop can be replaced
//           with individual statements:
//           ex:  intentFilter.addAction(BroadcastEvent.Type.AUDIO_MUTED_CHANGED.getAction());
//                intentFilter.addAction(BroadcastEvent.Type.CONFERENCE_TERMINATED.getAction());
//                ... other events
//         */
//        for (BroadcastEvent.Type type : BroadcastEvent.Type.values()) {
//            intentFilter.addAction(type.getAction());
//        }
//
//        LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);
//    }
//
//    // Example for handling different JitsiMeetSDK events
//    private void onBroadcastReceived(Intent intent) {
//        if (intent != null) {
//            BroadcastEvent event = new BroadcastEvent(intent);
//
//            switch (event.getType()) {
//                case CONFERENCE_JOINED:
////                    Timber.i("Conference Joined with url%s", event.getData().get("url"));
//                    Log.e("MAINACTIVITY:","CONF JOINED");
//                    break;
//                case PARTICIPANT_JOINED:
//                    Log.e("MAINACTIVITY:","PARTICIPANT JOINED");
////                    Timber.i("Participant joined%s", event.getData().get("name"));
//                    break;
//            }
//        }
//    }
//
//    // Example for sending actions to JitsiMeetSDK
//    private void hangUp() {
//        Intent hangupBroadcastIntent = BroadcastIntentHelper.buildHangUpIntent();
//        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(hangupBroadcastIntent);
//    }
//}
//

//
///**
// * The one and only Activity that the Jitsi Meet app needs. The
// * {@code Activity} is launched in {@code singleTask} mode, so it will be
// * created upon application initialization and there will be a single instance
// * of it. Further attempts at launching the application once it was already
// * launched will result in {@link MainActivity#onNewIntent(Intent)} being called.
// */
//public class MainActivity extends JitsiMeetActivity {
//    /**
//     * The request code identifying requests for the permission to draw on top
//     * of other apps. The value must be 16-bit and is arbitrarily chosen here.
//     */
//    private static final int OVERLAY_PERMISSION_REQUEST_CODE
//        = (int) (Math.random() * Short.MAX_VALUE);
//
//    /**
//     * ServerURL configuration key for restriction configuration using {@link android.content.RestrictionsManager}
//     */
//    public static final String RESTRICTION_SERVER_URL = "SERVER_URL";
//
//    /**
//     * Broadcast receiver for restrictions handling
//     */
//    private BroadcastReceiver broadcastReceiver;
//
//    /**
//     * Flag if configuration is provided by RestrictionManager
//     */
//    private boolean configurationByRestrictions = false;
//
//    /**
//     * Default URL as could be obtained from RestrictionManager
//     */
//    private String defaultURL;
//
//
//    // JitsiMeetActivity overrides
//    //
//
//    @Override
//    protected void onCreate(Bundle savedInstanceState) {
//        JitsiMeet.showSplashScreen(this);
//        super.onCreate(savedInstanceState);
//    }
//
//    @Override
//    protected boolean extraInitialize() {
//        Log.d(this.getClass().getSimpleName(), "LIBRE_BUILD="+BuildConfig.LIBRE_BUILD);
//
//        // Setup Crashlytics and Firebase Dynamic Links
//        // Here we are using reflection since it may have been disabled at compile time.
//        try {
//            Class<?> cls = Class.forName("org.jitsi.meet.GoogleServicesHelper");
//            Method m = cls.getMethod("initialize", JitsiMeetActivity.class);
//            m.invoke(null, this);
//        } catch (Exception e) {
//            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
//        }
//
//        // In Debug builds React needs permission to write over other apps in
//        // order to display the warning and error overlays.
//        if (BuildConfig.DEBUG) {
//            if (!Settings.canDrawOverlays(this)) {
//                Intent intent
//                    = new Intent(
//                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
//                    Uri.parse("package:" + getPackageName()));
//
//                startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);
//
//                return true;
//            }
//        }
//
//        return false;
//    }
//
//    @Override
//    protected void initialize() {
//        broadcastReceiver = new BroadcastReceiver() {
//            @Override
//            public void onReceive(Context context, Intent intent) {
//                // As new restrictions including server URL are received,
//                // conference should be restarted with new configuration.
//                leave();
//                recreate();
//            }
//        };
//        registerReceiver(broadcastReceiver,
//            new IntentFilter(Intent.ACTION_APPLICATION_RESTRICTIONS_CHANGED));
//
//        resolveRestrictions();
//        setJitsiMeetConferenceDefaultOptions();
//        super.initialize();
//    }
//
//    @Override
//    public void onDestroy() {
//        if (broadcastReceiver != null) {
//            unregisterReceiver(broadcastReceiver);
//            broadcastReceiver = null;
//        }
//
//        super.onDestroy();
//    }
//
//    private void setJitsiMeetConferenceDefaultOptions() {
//        // Set default options
//        JitsiMeetConferenceOptions defaultOptions
//            = new JitsiMeetConferenceOptions.Builder()
//            .setWelcomePageEnabled(true)
//            .setServerURL(buildURL(defaultURL))
//            .setFeatureFlag("call-integration.enabled", false)
//            .setFeatureFlag("resolution", 360)
//            .setFeatureFlag("server-url-change.enabled", !configurationByRestrictions)
//            .build();
//        JitsiMeet.setDefaultConferenceOptions(defaultOptions);
//
//
//    }
//
//    private void resolveRestrictions() {
//        RestrictionsManager manager =
//            (RestrictionsManager) getSystemService(Context.RESTRICTIONS_SERVICE);
//        Bundle restrictions = manager.getApplicationRestrictions();
//        Collection<RestrictionEntry> entries = manager.getManifestRestrictions(
//            getApplicationContext().getPackageName());
//        for (RestrictionEntry restrictionEntry : entries) {
//            String key = restrictionEntry.getKey();
//            if (RESTRICTION_SERVER_URL.equals(key)) {
//                // If restrictions are passed to the application.
//                if (restrictions != null &&
//                    restrictions.containsKey(RESTRICTION_SERVER_URL)) {
//                    defaultURL = restrictions.getString(RESTRICTION_SERVER_URL);
//                    configurationByRestrictions = true;
//                    // Otherwise use default URL from app-restrictions.xml.
//                } else {
//                    defaultURL = restrictionEntry.getSelectedString();
//                    configurationByRestrictions = false;
//                }
//            }
//        }
//    }
//
//    @Override
//    protected void onConferenceTerminated(HashMap<String, Object> extraData) {
//        Log.d(TAG, "Conference terminated: " + extraData);
//    }
//
//    // Activity lifecycle method overrides
//    //
//
//    @Override
//    public void onActivityResult(int requestCode, int resultCode, Intent data) {
//        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
//            if (Settings.canDrawOverlays(this)) {
//                initialize();
//                return;
//            }
//
//            throw new RuntimeException("Overlay permission is required when running in Debug mode.");
//        }
//
//        super.onActivityResult(requestCode, resultCode, data);
//    }
//
//    // ReactAndroid/src/main/java/com/facebook/react/ReactActivity.java
//    @Override
//    public boolean onKeyUp(int keyCode, KeyEvent event) {
//        if (BuildConfig.DEBUG && keyCode == KeyEvent.KEYCODE_MENU) {
//            JitsiMeet.showDevOptions();
//            return true;
//        }
//
//        return super.onKeyUp(keyCode, event);
//    }
//
//    @Override
//    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
//        super.onPictureInPictureModeChanged(isInPictureInPictureMode);
//
//        Log.d(TAG, "Is in picture-in-picture mode: " + isInPictureInPictureMode);
//
//
//        if (!isInPictureInPictureMode) {
//            this.startActivity(new Intent(this, getClass())
//                .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
//        }
//    }
//
//    // Helper methods
//    //
//
//    private @Nullable URL buildURL(String urlStr) {
//        try {
//            return new URL(urlStr);
//        } catch (MalformedURLException e) {
//            return null;
//        }
//    }
//}
