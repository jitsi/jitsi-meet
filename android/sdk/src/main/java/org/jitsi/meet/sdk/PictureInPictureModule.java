package org.jitsi.meet.sdk;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.os.Build;
import android.util.Log;
import android.util.Rational;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PictureInPictureModule extends ReactContextBaseJavaModule {
    private final static String TAG = "PictureInPicture";

    static boolean isPictureInPictureSupported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O;
    }

    public PictureInPictureModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Enters Picture-in-Picture (mode) for the current {@link Activity}.
     * Supported on Android API >= 26 (Oreo) only.
     *
     * @param promise a {@code Promise} which will resolve with a {@code null}
     * value upon success, and an {@link Exception} otherwise.
     */
    @ReactMethod
    public void enterPictureInPicture(Promise promise) {
        if (isPictureInPictureSupported()) {
            Activity currentActivity = getCurrentActivity();

            if (currentActivity == null) {
                promise.reject(new Exception("No current Activity!"));
                return;
            }

            Log.d(TAG, "Entering Picture-in-Picture");

            PictureInPictureParams.Builder builder
                = new PictureInPictureParams.Builder()
                    .setAspectRatio(new Rational(1, 1));
            boolean r
                = currentActivity.enterPictureInPictureMode(builder.build());

            if (r) {
                promise.resolve(null);
            } else {
                promise.reject(
                    new Exception("Failed to enter Picture-in-Picture"));
            }

            return;
        }

        promise.reject(new Exception("Picture-in-Picture not supported"));
    }

    @Override
    public String getName() {
        return TAG;
    }
}
