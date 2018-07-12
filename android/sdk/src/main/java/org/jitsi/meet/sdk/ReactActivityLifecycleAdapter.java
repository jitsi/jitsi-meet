package org.jitsi.meet.sdk;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

/**
 * Helper class to encapsulate the work which needs to be done on Activity
 * lifecycle methods in order for the React side to be aware of it.
 */
class ReactActivityLifecycleAdapter {
    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onBackPressed} so we can do the required internal
     * processing.
     *
     * @return {@code true} if the back-press was processed; {@code false},
     * otherwise. If {@code false}, the application should call the parent's
     * implementation.
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
     * Activity lifecycle method which should be called from
     * {@code Activity.onDestroy} so we can do the required internal
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
     * Activity lifecycle method which should be called from
     * {@code Activity.onPause} so we can do the required internal processing.
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
     * Activity lifecycle method which should be called from
     * {@code Activity.onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     */
    public static void onHostResume(Activity activity) {
        onHostResume(activity, new DefaultHardwareBackBtnHandlerImpl(activity));
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onResume} so we can do the required internal processing.
     *
     * @param activity {@code Activity} being resumed.
     * @param defaultBackButtonImpl a {@code DefaultHardwareBackBtnHandler} to
     * handle invoking the back button if no {@code JitsiMeetView} handles it.
     */
    public static void onHostResume(
        Activity activity,
        DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
        ReactInstanceManager reactInstanceManager
            = ReactInstanceManagerHolder.getReactInstanceManager();

        if (reactInstanceManager != null) {
            reactInstanceManager.onHostResume(activity, defaultBackButtonImpl);
        }
    }

    /**
     * Activity lifecycle method which should be called from
     * {@code Activity.onNewIntent} so we can do the required internal
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

}
