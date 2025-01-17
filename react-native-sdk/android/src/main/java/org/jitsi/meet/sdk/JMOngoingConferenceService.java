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

import android.content.Context;
import android.content.Intent;

import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;

import android.os.Build;
import android.os.IBinder;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.ReactActivity;
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

    public static void doLaunch(Context context) {
        try {
            RNOngoingNotification.createOngoingConferenceNotificationChannel(context);
            JitsiMeetLogger.i(TAG + " Notification channel creation completed");
        } catch (Exception e) {
            JitsiMeetLogger.e(e, TAG + " Error creating notification channel");
        }

        Intent intent = new Intent(context, JMOngoingConferenceService.class);

        try {
            context.startForegroundService(intent);
            JitsiMeetLogger.i(TAG + " Starting foreground service");
        } catch (RuntimeException e) {
            // Avoid crashing due to ForegroundServiceStartNotAllowedException (API level 31).
            // See: https://developer.android.com/guide/components/foreground-services#background-start-restrictions
            JitsiMeetLogger.w(TAG + " Ongoing conference service not started", e);
        }
    }

    public static void launch(Context context, ReactActivity reactActivity) {

        PermissionListener listener = new PermissionListener() {
            @Override
            public boolean onRequestPermissionsResult(int i, String[] strings, int[] results) {
                JitsiMeetLogger.i(TAG + " Permission callback received");

                if (results == null || results.length == 0) {
                    JitsiMeetLogger.w(TAG + " Permission results are null or empty");
                    return true;
                }

                int counter = 0;
                for (int result : results) {
                    if (result == PackageManager.PERMISSION_GRANTED) {
                        counter++;
                    }
                }

                JitsiMeetLogger.i(TAG + " Permissions granted: " + counter + "/" + results.length);

                if (counter == results.length) {
                    JitsiMeetLogger.i(TAG + " All permissions granted, launching service");
                    doLaunch(context);
                } else {
                    JitsiMeetLogger.w(TAG + " Not all permissions were granted");
                }

                return true;
            }
        };


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            JitsiMeetLogger.i(TAG + " Checking Tiramisu permissions");

            List<String> permissionsList = new ArrayList<>();

            permissionsList.add(POST_NOTIFICATIONS);
            permissionsList.add(RECORD_AUDIO);

            String[] permissionsArray = new String[ permissionsList.size() ];
            permissionsArray = permissionsList.toArray( permissionsArray );

            if (permissionsArray.length > 0) {
                try {
                    JitsiMeetLogger.i(TAG + " Requesting permissions: " + Arrays.toString(permissionsArray));
                    reactActivity.requestPermissions(permissionsArray, PERMISSIONS_REQUEST_CODE, listener);
                } catch (Exception e) {
                    JitsiMeetLogger.e(e, TAG + " Error requesting permissions");
                }
            } else {
                JitsiMeetLogger.i(TAG + " No permissions needed, launching service");
                doLaunch(context);
            }

        } else {
            JitsiMeetLogger.i(TAG + " Launching service");
            doLaunch(context);
        }
    }

    public static void abort(Context context) {
        Intent intent = new Intent(context, JMOngoingConferenceService.class);
        context.stopService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        JitsiMeetLogger.i(TAG + " onCreate called");

        try {
            Notification notification = RNOngoingNotification.buildOngoingConferenceNotification(this);
            JitsiMeetLogger.i(TAG + " Notification build result: " + (notification != null));

            if (notification == null) {
                stopSelf();
                JitsiMeetLogger.w(TAG + " Couldn't start service, notification is null");
            } else {
                JitsiMeetLogger.i(TAG + " Starting service in foreground with notification");

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK | ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
                } else if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIFICATION_ID, notification);
                }
            }
        } catch (Exception e) {
            JitsiMeetLogger.e(e, TAG + " Error in onCreate");
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
