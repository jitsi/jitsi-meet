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

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;

import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;

import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;


/**
 * Helper class for creating the ongoing notification which is used with
 * {@link JMOngoingConferenceService}. It allows the user to easily get back to the app
 * and to hangup from within the notification itself.
 */
class RNOngoingNotification {
    private static final String TAG = RNOngoingNotification.class.getSimpleName();

    static final String RN_ONGOING_CONFERENCE_CHANNEL_ID = "OngoingConferenceChannel";

    static void createOngoingConferenceNotificationChannel(Context context) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Service.NOTIFICATION_SERVICE);
        NotificationChannel channel = notificationManager.getNotificationChannel(RN_ONGOING_CONFERENCE_CHANNEL_ID);

        if (channel != null) {
            JitsiMeetLogger.i(TAG + " Notification channel already exists");
            return;
        }

        channel = new NotificationChannel(
            RN_ONGOING_CONFERENCE_CHANNEL_ID,
            context.getString(R.string.ongoing_notification_channel_name),
            NotificationManager.IMPORTANCE_DEFAULT
        );

        channel.enableVibration(true);
        channel.setShowBadge(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        notificationManager.createNotificationChannel(channel);
        JitsiMeetLogger.i(TAG + " Notification channel created with importance: " + channel.getImportance());
    }

    static Notification buildOngoingConferenceNotification(Context context) {
        if (context == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification: no current context");
            return null;
        }

        JitsiMeetLogger.i(TAG + " Creating notification with context: " + context);

        // Creating an intent to launch app's main activity
        Intent intent = context.getPackageManager()
            .getLaunchIntentForPackage(context.getPackageName());
        assert intent != null;
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        // Creating PendingIntent
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, RN_ONGOING_CONFERENCE_CHANNEL_ID);

        builder
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentTitle(context.getString(R.string.ongoing_notification_title))
            .setContentText(context.getString(R.string.ongoing_notification_text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setWhen(System.currentTimeMillis())
            .setUsesChronometer(true)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setSmallIcon(context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName()))
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(pendingIntent);

        return builder.build();
    }
}
