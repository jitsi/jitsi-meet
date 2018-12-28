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

import android.support.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class ReactContextUtils {
    public static boolean emitEvent(
            ReactContext reactContext,
            String eventName,
            @Nullable Object data) {
        if (reactContext == null) {
            // XXX If no ReactContext is specified, emit through the
            // ReactContext of ReactInstanceManager. ReactInstanceManager
            // cooperates with ReactContextUtils i.e. ReactInstanceManager will
            // not invoke ReactContextUtils without a ReactContext.
            return ReactInstanceManagerHolder.emitEvent(eventName, data);
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, data);

        return true;
    }
}
