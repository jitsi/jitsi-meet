/*
 * Copyright @ 2017-present Atlassian Pty Ltd
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

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = AppInfoModule.NAME)
class AppInfoModule
    extends ReactContextBaseJavaModule {

    public static final String NAME = "AppInfo";

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
        constants.put("LIBRE_BUILD", BuildConfig.LIBRE_BUILD);
        constants.put("GOOGLE_SERVICES_ENABLED", BuildConfig.GOOGLE_SERVICES_ENABLED);

        return constants;
    }

    @Override
    public String getName() {
        return NAME;
    }
}
