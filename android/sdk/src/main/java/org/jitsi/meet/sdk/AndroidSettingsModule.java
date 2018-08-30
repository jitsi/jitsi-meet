/**
 * Adapted from
 * {@link https://github.com/Aleksandern/react-native-android-settings-library}.
 */

package org.jitsi.meet.sdk;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

class AndroidSettingsModule
    extends ReactContextBaseJavaModule {

    public AndroidSettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AndroidSettings";
    }

    @ReactMethod
    public void open(Promise promise) {
        Context context = getReactApplicationContext();
        Intent intent = new Intent();

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(
            Uri.fromParts("package", context.getPackageName(), null));

        try {
            context.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            // Some devices may give an error here.
            // https://developer.android.com/reference/android/provider/Settings.html#ACTION_APPLICATION_DETAILS_SETTINGS
            promise.reject(e);
            return;
        }

        promise.resolve(null);
    }
}
