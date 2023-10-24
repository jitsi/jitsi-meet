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
import android.app.NotificationManager;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.HashMap;

/**
 * This class implements an Android {@link Service}, a foreground one specifically, and it's
 * responsible for presenting an ongoing notification when a conference is in progress.
 * The service will help keep the app running while in the background.
 *
 * See: https://developer.android.com/guide/components/services
 */
public class JitsiMeetOngoingConferenceService extends Service {
    private static final String TAG = JitsiMeetOngoingConferenceService.class.getSimpleName();
    private static final String EXTRA_DATA_KEY = "extraDataKey";
    private static final String EXTRA_DATA_BUNDLE_KEY = "extraDataBundleKey";


    public static void launch(Context context, HashMap<String, Object> extraData) {
        RNOngoingNotification.createOngoingConferenceNotificationChannel(context);

        Intent intent = new Intent(context, JitsiMeetOngoingConferenceService.class);

        Bundle extraDataBundle = new Bundle();
        extraDataBundle.putSerializable(EXTRA_DATA_KEY, extraData);
        intent.putExtra(EXTRA_DATA_BUNDLE_KEY, extraDataBundle);

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

    public static void abort(Context context) {
        Intent intent = new Intent(context, JitsiMeetOngoingConferenceService.class);
        context.stopService(intent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
