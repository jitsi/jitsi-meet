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
import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.util.ArrayDeque;
import java.util.Iterator;
import java.util.Queue;

/**
 * Helper class to encapsulate the work which needs to be done on
 * {@link Activity} lifecycle methods in order for the React side to be aware of
 * it.
 */
public class JitsiMeetActivityDelegate {
    /**
     * The permission request in progress, if any.
     */
    private static PendingPermissionRequest currentRequest;

    /**
     * Requests made while another one is in progress, started in order as each one completes.
     */
    private static final Queue<PendingPermissionRequest> queuedPermissionRequests = new ArrayDeque<>();

    /**
     * Cached back-button handler reused across {@code onHostResume} calls so we
     * don't allocate a new one every time the Activity is resumed. The handler
     * holds the Activity weakly, so caching it here does not leak it.
     */
    private static DefaultHardwareBackBtnHandlerImpl backBtnHandler;

    /**
     * Tells whether or not the permissions request is currently in progress.
     *
     * @return {@code true} if the permissions are being requested or {@code false} otherwise.
     */
    static boolean arePermissionsBeingRequested() {
        return currentRequest != null;
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
        ReactHost reactHost = ReactHostHolder.getReactHost();

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
        ReactHost reactHost = ReactHostHolder.getReactHost();

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
        endPermissionRequestsOf(activity);

        ReactHost reactHost = ReactHostHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onHostDestroy(activity);
        }
    }

    /**
     * A destroyed activity never gets its permission result, so end its requests here or the queue stalls.
     */
    private static synchronized void endPermissionRequestsOf(Activity activity) {
        // On a configuration change the result of the current request goes to the new instance.
        if (activity.isChangingConfigurations()) {
            return;
        }

        Iterator<PendingPermissionRequest> iterator = queuedPermissionRequests.iterator();

        while (iterator.hasNext()) {
            PendingPermissionRequest request = iterator.next();

            if (request.activity == activity) {
                iterator.remove();
                request.listener.onRequestPermissionsResult(request.requestCode, request.permissions, new int[0]);
            }
        }

        if (currentRequest != null && currentRequest.activity == activity) {
            onRequestPermissionsResult(currentRequest.requestCode, currentRequest.permissions, new int[0]);
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onPause} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being paused.
     */
    public static void onHostPause(Activity activity) {
        ReactHost reactHost = ReactHostHolder.getReactHost();

        if (reactHost != null) {
            try {
                reactHost.onHostPause(activity);
            } catch (AssertionError e) {
                // There seems to be a problem in RN when resuming an Activity when
                // rotation is involved and the planets align. There doesn't seem to
                // be a proper solution, but since the activity is going away anyway,
                // we'll YOLO-ignore the exception and hope fo the best.
                // Ref: https://github.com/facebook/react-native/search?q=Pausing+an+activity+that+is+not+the+current+activity%2C+this+is+incorrect%21&type=issues
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
        ReactHost reactHost = ReactHostHolder.getReactHost();

        if (reactHost != null) {
            if (backBtnHandler == null || backBtnHandler.getActivity() != activity) {
                backBtnHandler = new DefaultHardwareBackBtnHandlerImpl(activity);
            }
            reactHost.onHostResume(activity, backBtnHandler);
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
        ReactHost reactHost = ReactHostHolder.getReactHost();

        if (reactHost != null) {
            reactHost.onNewIntent(intent);
        }
    }

    public static synchronized void onRequestPermissionsResult(
            final int requestCode, final String[] permissions, final int[] grantResults) {
        if (currentRequest == null || currentRequest.requestCode != requestCode) {
            JitsiMeetLogger.w("Permission result with no matching request, ignored");

            return;
        }

        // Still current while the listener runs, so a request the listener makes is queued behind the others.
        currentRequest.listener.onRequestPermissionsResult(requestCode, permissions, grantResults);
        currentRequest = null;

        // Advance whatever the listener returns: RN returns false while it has other requests pending.
        PendingPermissionRequest next = queuedPermissionRequests.poll();

        if (next != null) {
            startPermissionRequest(next);
        }
    }

    public static synchronized void requestPermissions(Activity activity, String[] permissions, int requestCode, PermissionListener listener) {
        PendingPermissionRequest request = new PendingPermissionRequest(activity, permissions, requestCode, listener);

        // Android answers a second concurrent request with an empty result, so queue it.
        if (currentRequest != null) {
            JitsiMeetLogger.i("Permission request queued until the current one completes");
            queuedPermissionRequests.add(request);

            return;
        }

        startPermissionRequest(request);
    }

    private static void startPermissionRequest(PendingPermissionRequest request) {
        currentRequest = request;

        // requestPermissions can crash off the UI thread (ViewGroup.dispatchCancelPendingInputEvents), where the RN module calls it.
        // Answer with an empty (cancelled) result then, and for a destroyed activity.
        try {
            if (request.activity.isDestroyed()) {
                throw new IllegalStateException("Activity is destroyed");
            }

            request.activity.requestPermissions(request.permissions, request.requestCode);
        } catch (Exception e) {
            JitsiMeetLogger.e(e, "Error requesting permissions");
            onRequestPermissionsResult(request.requestCode, request.permissions, new int[0]);
        }
    }

    private static final class PendingPermissionRequest {
        final Activity activity;
        final String[] permissions;
        final int requestCode;
        final PermissionListener listener;

        PendingPermissionRequest(Activity activity, String[] permissions, int requestCode, PermissionListener listener) {
            this.activity = activity;
            this.permissions = permissions;
            this.requestCode = requestCode;
            this.listener = listener;
        }
    }
}
