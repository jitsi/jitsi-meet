/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;

import com.calendarevents.CalendarEventsPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionListener;

/**
 * Helper class to encapsulate the work which needs to be done on
 * {@link Activity} lifecycle methods in order for the React side to be aware of
 * it.
 */
public class ReactActivityLifecycleCallbacks {
    /**
     * Needed for making sure this class working with the "PermissionsAndroid"
     * React Native module.
     */
    private static PermissionListener permissionListener;
    private static Callback permissionsCallback;

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@link Activity#onBackPressed} so we can do the required internal
     * processing.
     *
     * @return {@code true} if the back-press was processed; {@code false},
     * otherwise. If {@code false}, the application should call the
     * {@code super}'s implementation.
     */
    public static boolean onBackPressed() {
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager == null) {
            return false;
        } else {
            reactInstanceManager.onBackPressed();
            return true;
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
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            reactInstanceManager.onHostDestroy(activity);
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onPause} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being paused.
     */
    public static void onHostPause(Activity activity) {
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            reactInstanceManager.onHostPause(activity);
        }
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     */
    public static void onHostResume(Activity activity) {
        onHostResume(activity, new DefaultHardwareBackBtnHandlerImpl(activity));
    }

    /**
     * {@link Activity} lifecycle method which should be called from
     * {@code Activity#onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     * @param defaultBackButtonImpl a {@link DefaultHardwareBackBtnHandler} to
     * handle invoking the back button if no {@link BaseReactView} handles it.
     */
    public static void onHostResume(
            Activity activity,
            DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            reactInstanceManager.onHostResume(activity, defaultBackButtonImpl);
        }

        if (permissionsCallback != null) {
            permissionsCallback.invoke();
            permissionsCallback = null;
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
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            reactInstanceManager.onNewIntent(intent);
        }
    }

    public static void onRequestPermissionsResult(
        final int requestCode,
        final String[] permissions,
        final int[] grantResults) {
        CalendarEventsPackage.onRequestPermissionsResult(
            requestCode,
            permissions,
            grantResults);
        permissionsCallback = new Callback() {
            @Override
            public void invoke(Object... args) {
                if (permissionListener != null
                        && permissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
                    permissionListener = null;
                }
            }
        };
    }

    @TargetApi(Build.VERSION_CODES.M)
    public static void requestPermissions(Activity activity, String[] permissions, int requestCode, PermissionListener listener) {
        permissionListener = listener;
        activity.requestPermissions(permissions, requestCode);
    }
}
