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
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * This class implements an Android {@link Service}, a foreground one specifically, and it's
 * responsible for presenting an ongoing notification when a conference is in progress.
 * The service will help keep the app running while in the background.
 *
 * See: https://developer.android.com/guide/components/services
 */
public class JMOngoingConferenceService extends Service {
    private static final String TAG = JMOngoingConferenceService.class.getSimpleName();

    private static final int PERMISSIONS_REQUEST_CODE = (int) (Math.random() * Short.MAX_VALUE);

    static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;

    public static void doLaunch(Context context, Activity currentActivity) {

        RNOngoingNotification.createOngoingConferenceNotificationChannel(currentActivity);

        Intent intent = new Intent(context, JMOngoingConferenceService.class);

        ComponentName componentName;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                componentName = context.startForegroundService(intent);
            } else {
                componentName = context.startService(intent);
            }
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

    public static void launch(Context context, Activity currentActivity) {
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
                        doLaunch(context, currentActivity);
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
            try {
                currentActivity.requestPermissions(permissionsArray, PERMISSIONS_REQUEST_CODE);
                JitsiMeetLogger.w(TAG + " Requesting permissions: " + Arrays.toString(permissionsArray));
            } catch (Exception e) {
                JitsiMeetLogger.e(e, "Error requesting permissions");
                listener.onRequestPermissionsResult(PERMISSIONS_REQUEST_CODE, permissionsArray, new int[0]);
            }
        } else {
            doLaunch(context, currentActivity);
            JitsiMeetLogger.w(TAG + " No permissions needed, launching service");
        }
    }

    public static void abort(Context context) {
        Intent intent = new Intent(context, JMOngoingConferenceService.class);
        context.stopService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        JitsiMeetLogger.w(TAG + " Building ongoing conference notification");

        Notification notification = RNOngoingNotification.buildOngoingConferenceNotification(this);
        if (notification == null) {
            stopSelf();
            JitsiMeetLogger.w(TAG + " Couldn't start service, notification is null");
        } else {
            JitsiMeetLogger.w(TAG + " Starting service in foreground with notification");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK | ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
            } else if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }
}
