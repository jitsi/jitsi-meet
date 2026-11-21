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
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.ContextCompat;

import com.facebook.react.ReactHost;
import com.facebook.react.modules.core.PermissionListener;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

import java.lang.ref.WeakReference;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.WeakHashMap;

/**
 * Helper class to encapsulate the work which needs to be done on
 * {@link Activity} lifecycle methods in order for the React side to be aware of
 * it.
 */
public class JitsiMeetActivityDelegate {
    private static final Handler MAIN_HANDLER = new Handler(Looper.getMainLooper());
    private static final ArrayDeque<PermissionRequest> permissionRequests = new ArrayDeque<>();
    private static final List<PermissionRequest> pendingRegistrations = new ArrayList<>();
    private static final WeakHashMap<Activity, Boolean> destroyedActivities = new WeakHashMap<>();
    private static PermissionRequest activePermissionRequest;
    private static boolean dispatchingPermissions;
    private static volatile boolean permissionRequestPending;
    private static int nextPermissionRequestCode = 0x8000;

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
        return permissionRequestPending;
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
        runOnMainThread(() -> {
            cancelPermissionsFor(activity);
            ReactHost reactHost = ReactHostHolder.getReactHost();
            if (reactHost != null) {
                reactHost.onHostDestroy(activity);
            }
        });
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

    public static void onRequestPermissionsResult(
            final int requestCode, final String[] permissions, final int[] grantResults) {
        onRequestPermissionsResult(null, requestCode, permissions, grantResults);
    }

    public static void onRequestPermissionsResult(Activity activity, int requestCode,
            String[] permissions, int[] grantResults) {
        runOnMainThread(() -> {
            PermissionRequest request = activePermissionRequest;
            if (request == null || request.internalCode != requestCode
                    || (activity != null && request.activity.get() != activity)
                    || (permissions != null && permissions.length > 0
                        && !Arrays.equals(permissions, request.permissions))) {
                return;
            }
            activePermissionRequest = null;
            updatePermissionRequestPending();
            String[] requestedPermissions = request.permissions;
            int[] results = grantResults != null && permissions != null
                && permissions.length == requestedPermissions.length
                && grantResults.length == requestedPermissions.length
                ? grantResults : new int[0];
            notifyPermissionListener(request, requestedPermissions, results);
            dispatchPermissionRequests();
        });
    }

    public static void requestPermissions(Activity activity, String[] permissions, int requestCode,
            PermissionListener listener) {
        if (listener == null) {
            return;
        }
        PermissionRequest request = new PermissionRequest(activity,
            permissions == null ? new String[0] : permissions.clone(), requestCode, listener);
        synchronized (pendingRegistrations) {
            pendingRegistrations.add(request);
            permissionRequestPending = true;
        }
        runOnMainThread(() -> {
            synchronized (pendingRegistrations) {
                if (!pendingRegistrations.remove(request)) {
                    return;
                }
            }
            permissionRequests.add(request);
            dispatchPermissionRequests();
        });
    }

    private static void runOnMainThread(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            action.run();
        } else {
            MAIN_HANDLER.post(action);
        }
    }

    private static void dispatchPermissionRequests() {
        if (dispatchingPermissions || activePermissionRequest != null) {
            return;
        }
        dispatchingPermissions = true;
        try {
            while (activePermissionRequest == null && !permissionRequests.isEmpty()) {
                PermissionRequest request = permissionRequests.remove();
                Activity activity = request.activity.get();
                if (activity == null || destroyedActivities.containsKey(activity)) {
                    notifyPermissionListener(request, request.permissions, new int[0]);
                    continue;
                }
                int[] grantedResults = new int[request.permissions.length];
                boolean allGranted = true;
                try {
                    for (int i = 0; i < request.permissions.length; i++) {
                        grantedResults[i] = ContextCompat.checkSelfPermission(activity, request.permissions[i]);
                        if (grantedResults[i] != PackageManager.PERMISSION_GRANTED) {
                            allGranted = false;
                        }
                    }
                } catch (Exception error) {
                    JitsiMeetLogger.e(error, "Error checking permissions");
                    notifyPermissionListener(request, request.permissions, new int[0]);
                    continue;
                }
                if (allGranted) {
                    notifyPermissionListener(request, request.permissions, grantedResults);
                    continue;
                }
                request.internalCode = nextPermissionRequestCode;
                nextPermissionRequestCode = nextPermissionRequestCode == 0xffff
                    ? 0x8000 : nextPermissionRequestCode + 1;
                activePermissionRequest = request;
                try {
                    activity.requestPermissions(request.permissions, request.internalCode);
                } catch (Exception error) {
                    JitsiMeetLogger.e(error, "Error requesting permissions");
                    activePermissionRequest = null;
                    notifyPermissionListener(request, request.permissions, new int[0]);
                }
            }
        } finally {
            updatePermissionRequestPending();
            dispatchingPermissions = false;
        }
    }

    private static void cancelPermissionsFor(Activity activity) {
        List<PermissionRequest> cancelled = new ArrayList<>();
        if (activePermissionRequest != null && activePermissionRequest.activity.get() == activity) {
            cancelled.add(activePermissionRequest);
            activePermissionRequest = null;
        }
        Iterator<PermissionRequest> iterator = permissionRequests.iterator();
        while (iterator.hasNext()) {
            PermissionRequest request = iterator.next();
            if (request.activity.get() == activity) {
                cancelled.add(request);
                iterator.remove();
            }
        }
        synchronized (pendingRegistrations) {
            destroyedActivities.put(activity, Boolean.TRUE);
            Iterator<PermissionRequest> pending = pendingRegistrations.iterator();
            while (pending.hasNext()) {
                PermissionRequest request = pending.next();
                if (request.activity.get() == activity) {
                    cancelled.add(request);
                    pending.remove();
                }
            }
        }
        updatePermissionRequestPending();
        for (PermissionRequest request : cancelled) {
            notifyPermissionListener(request, request.permissions, new int[0]);
        }
        dispatchPermissionRequests();
    }

    private static void updatePermissionRequestPending() {
        synchronized (pendingRegistrations) {
            permissionRequestPending = activePermissionRequest != null
                || !permissionRequests.isEmpty() || !pendingRegistrations.isEmpty();
        }
    }

    private static void notifyPermissionListener(PermissionRequest request, String[] permissions,
            int[] grantResults) {
        try {
            request.listener.onRequestPermissionsResult(request.originalCode, permissions, grantResults);
        } catch (Exception error) {
            JitsiMeetLogger.e(error, "Error delivering permission result");
        }
    }

    private static final class PermissionRequest {
        final WeakReference<Activity> activity;
        final String[] permissions;
        final int originalCode;
        final PermissionListener listener;
        int internalCode;

        PermissionRequest(Activity activity, String[] permissions, int originalCode,
                PermissionListener listener) {
            this.activity = new WeakReference<>(activity);
            this.permissions = permissions;
            this.originalCode = originalCode;
            this.listener = listener;
        }
    }
}
