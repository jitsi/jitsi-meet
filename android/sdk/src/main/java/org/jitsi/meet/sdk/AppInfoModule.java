/*
 * Copyright @ 2017-present 8x8, Inc.
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

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

@ReactModule(name = AppInfoModule.NAME)
class AppInfoModule
    extends ReactContextBaseJavaModule {

    private static final String BUILD_CONFIG = "org.jitsi.meet.sdk.BuildConfig";
    public static final String NAME = "AppInfo";
    public static final boolean GOOGLE_SERVICES_ENABLED = getGoogleServicesEnabled();
    public static final boolean LIBRE_BUILD = getLibreBuild();
    public static final String SDK_VERSION = getSdkVersion();

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
            "buildNumber",
            packageInfo == null ? "" : String.valueOf(packageInfo.versionCode));
        constants.put(
            "name",
            applicationInfo == null
                ? ""
                : packageManager.getApplicationLabel(applicationInfo));
        constants.put(
            "version",
            packageInfo == null ? "" : packageInfo.versionName);
        constants.put("sdkVersion", SDK_VERSION);
        constants.put("LIBRE_BUILD", LIBRE_BUILD);
        constants.put("GOOGLE_SERVICES_ENABLED", GOOGLE_SERVICES_ENABLED);

        return constants;
    }

    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Checks if libre google services object is null based on build configuration.
     */
    private static boolean getGoogleServicesEnabled() {
        Object googleServicesEnabled = getBuildConfigValue("GOOGLE_SERVICES_ENABLED");

        if (googleServicesEnabled !=null) {
            return (Boolean) googleServicesEnabled;
        }

        return false;
    }

    /**
     * Checks if libre build field is null based on build configuration.
     */
    private static boolean getLibreBuild() {
        Object libreBuild = getBuildConfigValue("LIBRE_BUILD");

        if (libreBuild !=null) {
            return (Boolean) libreBuild;
        }

        return false;
    }

    /**
     * Gets the SDK version.
     */
    private static String getSdkVersion() {
        Object sdkVersion = getBuildConfigValue("SDK_VERSION");

        if (sdkVersion !=null) {
            return (String) sdkVersion;
        }

        return "";
    }

    /**
     * Gets build config value of a certain field.
     *
     * @param fieldName Field from build config.
     */
    private static Object getBuildConfigValue(String fieldName) {
        try {
            Class<?> c = Class.forName(BUILD_CONFIG);
            Field f  = c.getDeclaredField(fieldName);
            f.setAccessible(true);
            return f.get(null);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
