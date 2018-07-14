/*
 * Copyright @ 2018-present Atlassian Pty Ltd
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

package org.jitsi.meet.sdk.incoming_call;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.jitsi.meet.sdk.AbstractExternalAPIModule;

public class IncomingCallExternalAPIModule
        extends AbstractExternalAPIModule<IncomingCallViewListener> {

    /**
     * Initializes a new {@code IncomingCallExternalAPIModule} instance. There
     * shall be a single instance of this module throughout the lifetime of the
     * application.
     *
     * @param reactContext The {@link ReactApplicationContext} where this module
     * is created.
     */
    public IncomingCallExternalAPIModule(ReactApplicationContext reactContext) {
        super(reactContext, IncomingCallViewListener.class);
    }

    @Override
    protected IncomingCallViewListener findListenerByExternalAPIScope(
            String scope) {
        IncomingCallView view
            = IncomingCallView.findViewByExternalAPIScope(scope);

        return view != null ? view.getListener() : null;
    }

    /**
     * Gets the name of this module to be used in the React Native bridge.
     *
     * @return The name of this module to be used in the React Native bridge.
     */
    @Override
    public String getName() {
        return "IncomingCallExternalAPI";
    }

    /**
     * Dispatches an event that occurred on the JavaScript side of the SDK to
     * the specified {@link IncomingCallView}'s listener.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     * @param scope
     */
    @Override
    @ReactMethod
    public void sendEvent(String name, ReadableMap data, String scope) {
        // XXX Overrides the super implementation to exposes it as a
        // react-native module method to the JavaScript source code.
        super.sendEvent(name, data, scope);
    }
}
