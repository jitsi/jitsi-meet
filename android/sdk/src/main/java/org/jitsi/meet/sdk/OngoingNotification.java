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
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.Random;


/**
 * Helper class for creating the ongoing notification which is used with
 * {@link JitsiMeetOngoingConferenceService}. It allows the user to easily get back to the app
 * and to hangup from within the notification itself.
 */
class OngoingNotification {
    private static final String TAG = OngoingNotification.class.getSimpleName();

    private static final String CHANNEL_ID = "JitsiNotificationChannel";
    private static final String CHANNEL_NAME = "Ongoing Conference Notifications";

    static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;


    static void createOngoingConferenceNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        Context context = ReactInstanceManagerHolder.getCurrentActivity();
        if (context == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification channel: no current context");
            return;
        }

        NotificationManager notificationManager
            = (NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel
            = notificationManager.getNotificationChannel(CHANNEL_ID);
        if (channel != null) {
            // The channel was already created, no need to do it again.
            return;
        }

        channel = new NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT);
        channel.enableLights(false);
        channel.enableVibration(false);
        channel.setShowBadge(false);

        notificationManager.createNotificationChannel(channel);
    }

    static Notification buildOngoingConferenceNotification() {
        Context context = ReactInstanceManagerHolder.getCurrentActivity();
        if (context == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification: no current context");
            return null;
        }

        Intent notificationIntent = new Intent(context, context.getClass());
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, notificationIntent, 0);

        NotificationCompat.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new NotificationCompat.Builder(context, CHANNEL_ID);
        } else {
            builder = new NotificationCompat.Builder(context);
        }

        builder
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentTitle(context.getString(R.string.ongoing_notification_title))
            .setContentText(context.getString(R.string.ongoing_notification_text))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setUsesChronometer(true)
            .setOnlyAlertOnce(true)
            .setSmallIcon(context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName()));

        // Add a "hang-up" action only if we are using ConnectionService.
        if (AudioModeModule.useConnectionService()) {
            Intent hangupIntent = new Intent(context, JitsiMeetOngoingConferenceService.class);
            hangupIntent.setAction(JitsiMeetOngoingConferenceService.Actions.HANGUP);
            PendingIntent hangupPendingIntent
                = PendingIntent.getService(context, 0, hangupIntent, PendingIntent.FLAG_UPDATE_CURRENT);
            NotificationCompat.Action hangupAction = new NotificationCompat.Action(0, "Hang up", hangupPendingIntent);

            builder.addAction(hangupAction);
        }

        return builder.build();
    }
}
