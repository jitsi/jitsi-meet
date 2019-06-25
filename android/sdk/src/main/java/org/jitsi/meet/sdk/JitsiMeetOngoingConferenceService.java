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

import android.app.Activity;
import android.app.Notification;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

import java.util.Random;

public class JitsiMeetOngoingConferenceService extends Service implements OngoingConferenceTracker.OngoingConferenceListener {
    private static final String TAG = JitsiMeetOngoingConferenceService.class.getSimpleName();

    private static final int NOTIFICATION_ID = new Random().nextInt(99999) + 10000;

    static final class Actions {
        static final String ONGOING_CONFERENCE = TAG + ":ONGOING_CONFERENCE";
        static final String HANGUP = TAG + ":HANGUP";
    }

    private static Class pendingIntentActivityClass;

    public static void setPendingIntentActivityClass(Class clazz) {
        pendingIntentActivityClass = clazz;
    }

    static void launch(Context context) {
        NotificationUtils.createOngoingConferenceNotificationChannel();

        Intent intent = new Intent(context, JitsiMeetOngoingConferenceService.class);
        intent.setAction(Actions.ONGOING_CONFERENCE);

        ComponentName componentName = context.startService(intent);
        if (componentName == null) {
            Log.w(TAG, "Ongoing conference service not started");
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();

        OngoingConferenceTracker.addListener(this);
    }

    @Override
    public void onDestroy() {
        OngoingConferenceTracker.removeListener(this);

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        final String action = intent.getAction();
        if (action.equals(Actions.ONGOING_CONFERENCE)) {
            Notification notification
                = NotificationUtils.buildOngoingConferenceNotification(pendingIntentActivityClass);
            startForeground(NOTIFICATION_ID, notification);
            Log.i(TAG, "Service started");
        } else if (action.equals(Actions.HANGUP)) {
            Log.i(TAG, "Hangup requested");
            // Abort all ongoing calls
            if (AudioModeModule.useConnectionService()) {
                ConnectionService.abortConnections();
            }
        } else {
            Log.w(TAG, "Unknown action received: " + action);
        }

        return START_NOT_STICKY;
    }

    @Override
    public void onCurrentConferenceChanged(String conferenceUrl) {
        if (conferenceUrl == null) {
            stopSelf();
            Log.i(TAG, "Service stopped");
        }
    }
}
