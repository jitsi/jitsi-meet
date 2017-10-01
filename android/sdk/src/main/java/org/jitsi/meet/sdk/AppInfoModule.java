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
    public AppInfoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Gets a {@code Map} of constants this module exports to JS. Supports JSON
     * types.
     *
     * @return a {@link Map} of constants this module exports to JS
     */
    @Override
    public Map<String, Object> getConstants() {
        Context context = getReactApplicationContext();
        PackageManager packageManager = context.getPackageManager();
        ApplicationInfo applicationInfo;
        PackageInfo packageInfo;

        try {
             String packageName = context.getPackageName();

             applicationInfo
                 = packageManager.getApplicationInfo(packageName, 0);
             packageInfo = packageManager.getPackageInfo(packageName, 0);
        } catch (PackageManager.NameNotFoundException e) {
             applicationInfo = null;
             packageInfo = null;
        }

        Map<String, Object> constants = new HashMap<>();

        constants.put(
            "name",
            applicationInfo == null
                ? ""
                : packageManager.getApplicationLabel(applicationInfo));
        constants.put(
            "version",
            packageInfo == null ? "" : packageInfo.versionName);

        return constants;
    }

    @Override
    public String getName() {
        return "AppInfo";
    }
}
