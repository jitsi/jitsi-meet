package org.jitsi.meet.sdk;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.ArrayList;
import java.util.List;

class NotificationUtils {

    static final String ONGOING_CONFERENCE_CHANNEL_ID = "JitsiOngoingConferenceChannel";

    public static List<String> allIds = new ArrayList<String>() {{ add(ONGOING_CONFERENCE_CHANNEL_ID); }};

    private static final String TAG = NotificationUtils.class.getSimpleName();

    static void createNotificationChannel(Activity context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

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
}
