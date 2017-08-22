/**
 * Adapted from
 * {@link https://github.com/Aleksandern/react-native-android-settings-library}.
 */

package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

class AndroidSettingsModule extends ReactContextBaseJavaModule {
    /**
     * React Native module name.
     */
    private static final String MODULE_NAME = "AndroidSettings";

    public AndroidSettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void open() {
        Context context = getReactApplicationContext();
        Intent intent = new Intent();

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(
            Uri.fromParts("package", context.getPackageName(), null));

        context.startActivity(intent);
    }
}
