package org.jitsi.meet.sdk;
import android.app.Notification;

import java.util.Random;


public interface OngoingNotificationInterface {
    void createOngoingConferenceNotificationChannel();

    Notification buildOngoingConferenceNotification(boolean isMuted);

    int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;

    void resetStartingtime();
}
