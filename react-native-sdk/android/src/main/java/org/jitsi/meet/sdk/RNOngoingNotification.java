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

import androidx.annotation.StringRes;
import androidx.core.app.NotificationCompat;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.Random;

/**
 * Helper class for creating the ongoing notification which is used with
 * {@link JitsiMeetOngoingConferenceService}. It allows the user to easily get back to the app
 * and to hangup from within the notification itself.
 */
class RNOngoingNotification {
    private static final String TAG = RNOngoingNotification.class.getSimpleName();

    static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;

    static void createOngoingConferenceNotificationChannel(Context activityContext) {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        if (activityContext == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification channel: no current context");
            return;
        }

        NotificationManager notificationManager
            = (NotificationManager) activityContext.getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel
            = notificationManager.getNotificationChannel("JitsiOngoingConferenceChannel");
        if (channel != null) {
            // The channel was already created, no need to do it again.
            return;
        }

        channel = new NotificationChannel("JitsiOngoingConferenceChannel", activityContext.getString(R.string.ongoing_notification_channel_name), NotificationManager.IMPORTANCE_DEFAULT);
        channel.enableLights(false);
        channel.enableVibration(false);
        channel.setShowBadge(false);

        notificationManager.createNotificationChannel(channel);
    }

    static Notification buildOngoingConferenceNotification(Context context) {

        if (context == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification: no current context");
            return null;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "JitsiOngoingConferenceChannel");

        builder
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentTitle(context.getString(R.string.ongoing_notification_title))
            .setContentText(context.getString(R.string.ongoing_notification_text))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setOngoing(true)
            .setWhen(System.currentTimeMillis())
            .setUsesChronometer(true)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setSmallIcon(context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName()));

        return builder.build();
    }
}
