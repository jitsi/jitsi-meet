package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.util.HashMap;
import java.util.Map;

class AppInfoModule extends ReactContextBaseJavaModule {
    /**
     * React Native module name.
     */
    private static final String MODULE_NAME = "AppInfo";

    public AppInfoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Gets a mapping with the constants this module is exporting.
     *
     * @return a {@link Map} mapping the constants to be exported with their
     * values.
     */
    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> constants = new HashMap<>();
        Context context = getReactApplicationContext();
        PackageManager pm = context.getPackageManager();
        ApplicationInfo appInfo;
        PackageInfo packageInfo;

        try {
             appInfo = pm.getApplicationInfo(context.getPackageName(), 0);
             packageInfo = pm.getPackageInfo(context.getPackageName(), 0);
        } catch (PackageManager.NameNotFoundException e) {
            constants.put("name", "");
            constants.put("version", "");
            return constants;
        }

        constants.put("name", pm.getApplicationLabel(appInfo));
        constants.put("version", packageInfo.versionName);
        return constants;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }
}
