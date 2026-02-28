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

/*
 * Based on https://github.com/DylanVann/react-native-locale-detector
 */

package org.jitsi.meet.sdk;

import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.util.HashMap;
import java.util.Map;
import java.util.Locale;

/**
 * Module which provides information about the system locale.
 */
class LocaleDetector extends ReactContextBaseJavaModule {

    public LocaleDetector(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    // Configuration.locale is deprecated (API 24); on N+ use Configuration.getLocales().get(0)
    // and continue returning full language tags via Locale.toLanguageTag() for JS compatibility.
    private String getCurrentLocaleTag(Context context) {
        Configuration config = context.getResources().getConfiguration();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            if (config.getLocales() != null && !config.getLocales().isEmpty()) {
                // Use the first locale from the LocaleList
                return config.getLocales().get(0).toLanguageTag();
            }
        }

        Locale locale = config.locale != null ? config.locale : Locale.getDefault();
        return locale.toLanguageTag();
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
        HashMap<String,Object> constants = new HashMap<>();
        constants.put("locale", getCurrentLocaleTag(context));
        return constants;
    }

    @Override
    public String getName() {
        return "LocaleDetector";
    }
}
