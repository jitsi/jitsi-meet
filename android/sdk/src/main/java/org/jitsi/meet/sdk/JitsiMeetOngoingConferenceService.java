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

import static android.Manifest.permission.POST_NOTIFICATIONS;
import static android.Manifest.permission.RECORD_AUDIO;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

/**
 * This class implements an Android {@link Service}, a foreground one specifically, and it's
 * responsible for presenting an ongoing notification when a conference is in progress.
 * The service will help keep the app running while in the background.
 *
 * See: https://developer.android.com/guide/components/services
 */
public class JitsiMeetOngoingConferenceService extends Service implements OngoingConferenceTracker.OngoingConferenceListener {
    private static final String TAG = JitsiMeetOngoingConferenceService.class.getSimpleName();
    private static final String ACTIVITY_DATA_KEY = "activityDataKey";
    private static final String EXTRA_DATA_KEY = "extraDataKey";
    private static final String EXTRA_DATA_BUNDLE_KEY = "extraDataBundleKey";
    private static final String IS_AUDIO_MUTED_KEY = "isAudioMuted";

    private static final int PERMISSIONS_REQUEST_CODE = (int) (Math.random() * Short.MAX_VALUE);

    private final BroadcastReceiver broadcastReceiver = new BroadcastReceiver();

    private boolean isAudioMuted;
    private Class tapBackActivity;

    static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;

    private static void doLaunch(Context context, HashMap<String, Object> extraData) {
        Activity activity = (Activity) context;

        OngoingNotification.createNotificationChannel(activity);

        Intent intent = new Intent(context, JitsiMeetOngoingConferenceService.class);

        Bundle extraDataBundle = new Bundle();
        extraDataBundle.putSerializable(EXTRA_DATA_KEY, extraData);

        intent.putExtra(EXTRA_DATA_BUNDLE_KEY, extraDataBundle);
        intent.putExtra(ACTIVITY_DATA_KEY, activity.getClass().getCanonicalName());

        ComponentName componentName;

        try {
            componentName = context.startForegroundService(intent);
        } catch (RuntimeException e) {
            // Avoid crashing due to ForegroundServiceStartNotAllowedException (API level 31).
            // See: https://developer.android.com/guide/components/foreground-services#background-start-restrictions
            JitsiMeetLogger.w(TAG + " Ongoing conference service not started", e);
            return;
        }

        if (componentName == null) {
            JitsiMeetLogger.w(TAG + " Ongoing conference service not started");
        }
    }


    public static void launch(Context context, HashMap<String, Object> extraData) {
        List<String> permissionsList = new ArrayList<>();

        PermissionListener listener = new PermissionListener() {
            @Override
            public boolean onRequestPermissionsResult(int i, String[] strings, int[] results) {
                int counter = 0;

                if (results.length > 0) {
                    for (int result : results) {
                        if (result == PackageManager.PERMISSION_GRANTED) {
                            counter++;
                        }
                    }

                    if (counter == results.length){
                        doLaunch(context, extraData);
                        JitsiMeetLogger.w(TAG + " Service launched, permissions were granted");
                    } else {
                        JitsiMeetLogger.w(TAG + " Couldn't launch service, permissions were not granted");
                    }
                }

                return true;
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsList.add(POST_NOTIFICATIONS);
            permissionsList.add(RECORD_AUDIO);
        }

        String[] permissionsArray = new String[ permissionsList.size() ];
        permissionsArray = permissionsList.toArray( permissionsArray );

        if (permissionsArray.length > 0) {
            JitsiMeetActivityDelegate.requestPermissions(
                (Activity) context,
                permissionsArray,
                PERMISSIONS_REQUEST_CODE,
                listener
            );
        } else {
            doLaunch(context, extraData);
            JitsiMeetLogger.w(TAG + " Service launched");
        }
    }

    public static void abort(Context context) {
        Intent intent = new Intent(context, JitsiMeetOngoingConferenceService.class);
        context.stopService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();

        Notification notification = OngoingNotification.buildOngoingConferenceNotification(isAudioMuted, this, tapBackActivity);
        if (notification == null) {
            stopSelf();
            JitsiMeetLogger.w(TAG + " Couldn't start service, notification is null");
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK | ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
            } else if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        }

        OngoingConferenceTracker.getInstance().addListener(this);

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BroadcastEvent.Type.AUDIO_MUTED_CHANGED.getAction());
        LocalBroadcastManager.getInstance(getApplicationContext()).registerReceiver(broadcastReceiver, intentFilter);
    }

    @Override
    public void onDestroy() {
        OngoingConferenceTracker.getInstance().removeListener(this);
        LocalBroadcastManager.getInstance(getApplicationContext()).unregisterReceiver(broadcastReceiver);

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        final String actionName = intent.getAction();
        final Action action = Action.fromName(actionName);

        if (action != Action.HANGUP) {
            Boolean isAudioMuted = tryParseIsAudioMuted(intent);

            if (isAudioMuted != null) {
                this.isAudioMuted = Boolean.parseBoolean(intent.getStringExtra("muted"));
            }

            if (tapBackActivity == null) {
                String targetActivityName = intent.getExtras().getString(ACTIVITY_DATA_KEY);
                Class<? extends Activity> targetActivity = null;
                try {
                    targetActivity = Class.forName(targetActivityName).asSubclass(Activity.class);
                    tapBackActivity = targetActivity;
                } catch (ClassNotFoundException e) {
                    JitsiMeetLogger.w(TAG + " Could not find target Activity: " + targetActivityName);
                }
            }

            Notification notification = OngoingNotification.buildOngoingConferenceNotification(this.isAudioMuted, this, tapBackActivity);
            if (notification == null) {
                stopSelf();
                JitsiMeetLogger.w(TAG + " Couldn't start service, notification is null");
            } else {
                NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                notificationManager.notify(NOTIFICATION_ID, notification);
            }
        }

        // When starting the service, there is no action passed in the intent
        if (action != null) {
            switch (action) {
                case UNMUTE:
                case MUTE:
                    Intent muteBroadcastIntent = BroadcastIntentHelper.buildSetAudioMutedIntent(action == Action.MUTE);
                    LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(muteBroadcastIntent);
                    break;
                case HANGUP:
                    JitsiMeetLogger.i(TAG + " Hangup requested");

                    Intent hangupBroadcastIntent = BroadcastIntentHelper.buildHangUpIntent();
                    LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(hangupBroadcastIntent);

                    stopSelf();
                    break;
                default:
                    JitsiMeetLogger.w(TAG + " Unknown action received: " + action);
                    break;
            }
        }

        return START_NOT_STICKY;
    }

    @Override
    public void onCurrentConferenceChanged(String conferenceUrl) {
        if (conferenceUrl == null) {
            stopSelf();
            OngoingNotification.resetStartingtime();
            JitsiMeetLogger.i(TAG + "Service stopped");
        }
    }

    public enum Action {
        HANGUP(TAG + ":HANGUP"),
        MUTE(TAG + ":MUTE"),
        UNMUTE(TAG + ":UNMUTE");

        private final String name;

        Action(String name) {
            this.name = name;
        }

        public static Action fromName(String name) {
            for (Action action : Action.values()) {
                if (action.name.equalsIgnoreCase(name)) {
                    return action;
                }
            }
            return null;
        }

        public String getName() {
            return name;
        }
    }

    private Boolean tryParseIsAudioMuted(Intent intent) {
        try {
            HashMap<String, Object> extraData = (HashMap<String, Object>) intent.getBundleExtra(EXTRA_DATA_BUNDLE_KEY).getSerializable(EXTRA_DATA_KEY);
            return Boolean.parseBoolean((String) extraData.get(IS_AUDIO_MUTED_KEY));
        } catch (Exception ignored) {
        }
        return null;
    }

    private class BroadcastReceiver extends android.content.BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            Class tapBackActivity = JitsiMeetOngoingConferenceService.this.tapBackActivity;
            isAudioMuted = Boolean.parseBoolean(intent.getStringExtra("muted"));
            Notification notification = OngoingNotification.buildOngoingConferenceNotification(isAudioMuted, context, tapBackActivity);
            if (notification == null) {
                stopSelf();
                JitsiMeetLogger.w(TAG + " Couldn't update service, notification is null");
            } else {
                NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                notificationManager.notify(NOTIFICATION_ID, notification);

                JitsiMeetLogger.i(TAG + " audio muted changed");
            }
        }
    }
}
