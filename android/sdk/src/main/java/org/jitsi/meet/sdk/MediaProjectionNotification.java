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

import static org.jitsi.meet.sdk.NotificationUtils.ONGOING_CONFERENCE_CHANNEL_ID;

import android.app.Notification;
import android.content.Context;

import androidx.core.app.NotificationCompat;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

/**
 * Helper class for creating the media projection notification which is used with
 * {@link JitsiMeetMediaProjectionService}.
 */
class MediaProjectionNotification {
    private static final String TAG = MediaProjectionNotification.class.getSimpleName();

    static Notification buildMediaProjectionNotification(Context context) {

        if (context == null) {
            JitsiMeetLogger.d(TAG, " Cannot create notification: no current context");
            return null;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, ONGOING_CONFERENCE_CHANNEL_ID);

        builder
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentTitle(context.getString(R.string.media_projection_notification_title))
            .setContentText(context.getString(R.string.media_projection_notification_text))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(false)
            .setUsesChronometer(false)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setSmallIcon(context.getResources().getIdentifier("ic_notification", "drawable", context.getPackageName()));

        return builder.build();
    }
}
