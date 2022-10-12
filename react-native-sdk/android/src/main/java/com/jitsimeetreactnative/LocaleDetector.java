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

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.util.HashMap;
import java.util.Map;

/**
 * Module which provides information about the system locale.
 */
class LocaleDetector extends ReactContextBaseJavaModule {

    public LocaleDetector(ReactApplicationContext reactContext) {
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
        HashMap<String,Object> constants = new HashMap<>();
        constants.put("locale", context.getResources().getConfiguration().locale.toLanguageTag());
        return constants;
    }

    @Override
    public String getName() {
        return "LocaleDetector";
    }
}
