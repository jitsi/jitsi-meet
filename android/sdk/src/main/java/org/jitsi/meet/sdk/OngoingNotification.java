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

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import androidx.annotation.StringRes;
import androidx.core.app.NotificationCompat;


/**
 * Helper class for creating the ongoing notification which is used with
 * {@link JitsiMeetOngoingConferenceService}. It allows the user to easily get back to the app
 * and to hangup from within the notification itself.
 */
class OngoingNotification {
    private static final String TAG = OngoingNotification.class.getSimpleName();

    private static long startingTime = 0;

    static final String ONGOING_CONFERENCE_CHANNEL_ID = "JitsiOngoingConferenceChannel";

    static void createNotificationChannel(Activity context) {
        if (context == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification channel: no current context");
            return;
        }

        NotificationManager notificationManager
            = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel
            = notificationManager.getNotificationChannel(ONGOING_CONFERENCE_CHANNEL_ID);

        if (channel != null) {
            // The channel was already created, no need to do it again.
            return;
        }

        channel = new NotificationChannel(ONGOING_CONFERENCE_CHANNEL_ID, context.getString(R.string.ongoing_notification_channel_name), NotificationManager.IMPORTANCE_DEFAULT);
        channel.enableLights(false);
        channel.enableVibration(false);
        channel.setShowBadge(false);

        notificationManager.createNotificationChannel(channel);
    }

    static Notification buildOngoingConferenceNotification(Boolean isMuted, Context context, Class tapBackActivity) {
        if (context == null) {
            JitsiMeetLogger.w(TAG + " Cannot create notification: no current context");
            return null;
        }

        Intent notificationIntent = new Intent(context, tapBackActivity == null ? context.getClass() : tapBackActivity);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, ONGOING_CONFERENCE_CHANNEL_ID);

        if (startingTime == 0) {
            startingTime = System.currentTimeMillis();
        }

        builder
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentTitle(context.getString(R.string.ongoing_notification_title))
            .setContentText(context.getString(R.string.ongoing_notification_text))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setWhen(startingTime)
            .setUsesChronometer(true)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setSmallIcon(context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName()));

        NotificationCompat.Action hangupAction = createAction(context, JitsiMeetOngoingConferenceService.Action.HANGUP, R.string.ongoing_notification_action_hang_up);

        JitsiMeetOngoingConferenceService.Action toggleAudioAction = isMuted
            ? JitsiMeetOngoingConferenceService.Action.UNMUTE : JitsiMeetOngoingConferenceService.Action.MUTE;
        int toggleAudioTitle = isMuted ? R.string.ongoing_notification_action_unmute : R.string.ongoing_notification_action_mute;
        NotificationCompat.Action audioAction = createAction(context, toggleAudioAction, toggleAudioTitle);

        builder.addAction(hangupAction);
        builder.addAction(audioAction);

        return builder.build();
    }

    static void resetStartingtime() {
        startingTime = 0;
    }

    private static NotificationCompat.Action createAction(Context context, JitsiMeetOngoingConferenceService.Action action, @StringRes int titleId) {
        Intent intent = new Intent(context, JitsiMeetOngoingConferenceService.class);
        intent.setAction(action.getName());
        PendingIntent pendingIntent
            = PendingIntent.getService(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);
        String title = context.getString(titleId);
        return new NotificationCompat.Action(0, title, pendingIntent);
    }
}
