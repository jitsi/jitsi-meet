/*
 * Copyright @ 2018-present 8x8, Inc.
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
import android.content.Intent;

import com.facebook.react.ReactHost;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

/**
 * Helper class to encapsulate the work which needs to be done on
 * {@link Activity} lifecycle methods in order for the React side to be aware of
 * it.
 */
public class JitsiMeetActivityDelegate {
    /**
     * Needed for making sure this class working with the "PermissionsAndroid"
     * React Native module.
     */
    private static PermissionListener permissionListener;

    /**
     * Tells whether or not the permissions request is currently in progress.
     *
     * @return {@code true} if the permissions are being requested or {@code false} otherwise.
     */
    static boolean arePermissionsBeingRequested() {
        return permissionListener != null;
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onActivityResult} so we are notified about results of external intents
     * started/finished.
     *
     * @param activity {@code Activity} activity from where the result comes from.
     * @param requestCode {@code int} code of the request.
     * @param resultCode {@code int} code of the result.
     * @param data {@code Intent} the intent of the activity.
     */
    public static void onActivityResult(
            Activity activity,
            int requestCode,
            int resultCode,
            Intent data) {
        ReactHost reactHost = ReactInstanceManagerHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onActivityResult(activity, requestCode, resultCode, data);
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@link Activity#onBackPressed} so we can do the required internal
     * processing.
     *
     * @return {@code true} if the back-press was processed; {@code false},
     * otherwise. If {@code false}, the application should call the
     * {@code super}'s implementation.
     */
    public static void onBackPressed() {
        ReactHost reactHost = ReactInstanceManagerHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onBackPressed();
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onDestroy} so we can do the required internal
     * processing.
     *
     * @param activity {@code Activity} being destroyed.
     */
    public static void onHostDestroy(Activity activity) {
        ReactHost reactHost = ReactInstanceManagerHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onHostDestroy(activity);
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onPause} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being paused.
     */
    public static void onHostPause(Activity activity) {
        ReactHost reactHost = ReactInstanceManagerHolder.getReactHost();

        if (reactHost != null) {
            try {
                reactHost.onHostPause(activity);
            } catch (AssertionError e) {
                JitsiMeetLogger.e(e, "Error running onHostPause, ignoring");
            }
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     */
    public static void onHostResume(Activity activity) {
        ReactHost reactHost = ReactInstanceManagerHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onHostResume(activity, new DefaultHardwareBackBtnHandlerImpl(activity));
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onNewIntent} so we can do the required internal
     * processing. Note that this is only needed if the activity's "launchMode"
     * was set to "singleTask". This is required for deep linking to work once
     * the application is already running.
     *
     * @param intent {@code Intent} instance which was received.
     */
    public static void onNewIntent(Intent intent) {
        ReactHost reactHost = ReactInstanceManagerHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onNewIntent(intent);
        }
    }

    public static void onRequestPermissionsResult(
            final int requestCode, final String[] permissions, final int[] grantResults) {
        // Invoke the callback immediately
        if (permissionListener != null && permissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
            permissionListener = null;
        }
    }

    public static void requestPermissions(Activity activity, String[] permissions, int requestCode, PermissionListener listener) {
        permissionListener = listener;

        // The RN Permissions module calls this in a non-UI thread. What we observe is a crash in ViewGroup.dispatchCancelPendingInputEvents,
        // which is called on the calling (ie, non-UI) thread. This doesn't look very safe, so try to avoid a crash by pretending the permission
        // was denied.

        try {
            activity.requestPermissions(permissions, requestCode);
        } catch (Exception e) {
            JitsiMeetLogger.e(e, "Error requesting permissions");
            onRequestPermissionsResult(requestCode, permissions, new int[0]);
        }
    }
}
