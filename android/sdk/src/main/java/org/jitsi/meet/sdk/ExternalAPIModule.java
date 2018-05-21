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

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.UiThreadUtil;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Module implementing a simple API to enable a proximity sensor-controlled
 * wake lock. When the lock is held, if the proximity sensor detects a nearby
 * object it will dim the screen and disable touch controls. The functionality
 * is used with the conference audio-only mode.
 */
class ExternalAPIModule extends ReactContextBaseJavaModule {
    /**
     * The {@code Method}s of {@code JitsiMeetViewListener} by event name i.e.
     * redux action types.
     */
    private static final Map<String, Method> JITSI_MEET_VIEW_LISTENER_METHODS
        = new HashMap<>();

    static {
        // Figure out the mapping between the JitsiMeetViewListener methods
        // and the events i.e. redux action types.
        Pattern onPattern = Pattern.compile("^on[A-Z]+");
        Pattern camelcasePattern = Pattern.compile("([a-z0-9]+)([A-Z0-9]+)");

        for (Method method : JitsiMeetViewListener.class.getDeclaredMethods()) {
            // * The method must be public (because it is declared by an
            //   interface).
            // * The method must be/return void.
            if (!Modifier.isPublic(method.getModifiers())
                    || !Void.TYPE.equals(method.getReturnType())) {
                continue;
            }

            // * The method name must start with "on" followed by a
            //   capital/uppercase letter (in agreement with the camelcase
            //   coding style customary to Java in general and the projects of
            //   the Jitsi community in particular).
            String name = method.getName();

            if (!onPattern.matcher(name).find()) {
                continue;
            }

            // * The method must accept/have exactly 1 parameter of a type
            //   assignable from HashMap.
            Class<?>[] parameterTypes = method.getParameterTypes();

            if (parameterTypes.length != 1
                    || !parameterTypes[0].isAssignableFrom(HashMap.class)) {
                continue;
            }

            // Convert the method name to an event name.
            name
                = camelcasePattern.matcher(name.substring(2))
                    .replaceAll("$1_$2")
                    .toUpperCase(Locale.ROOT);
            JITSI_MEET_VIEW_LISTENER_METHODS.put(name, method);
        }
    }

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
     *
     * @param reactContext the {@link ReactApplicationContext} where this module
     * is created.
     */
    public ExternalAPIModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Gets the name of this module to be used in the React Native bridge.
     *
     * @return The name of this module to be used in the React Native bridge.
     */
    @Override
    public String getName() {
        return "ExternalAPI";
    }

    /**
     * The internal processing for the URL of the current conference set on the
     * associated {@link JitsiMeetView}.
     *
     * @param eventName the name of the external API event to be processed
     * @param eventData the details/specifics of the event to process determined
     * by/associated with the specified {@code eventName}.
     * @param view the {@link JitsiMeetView} instance.
     */
    private void maybeSetViewURL(
            String eventName,
            ReadableMap eventData,
            JitsiMeetView view) {
        switch(eventName) {
        case "CONFERENCE_WILL_JOIN":
            view.setURL(eventData.getString("url"));
            break;

        case "CONFERENCE_FAILED":
        case "CONFERENCE_WILL_LEAVE":
        case "LOAD_CONFIG_ERROR":
            String url = eventData.getString("url");

            if (url != null && url.equals(view.getURL())) {
                view.setURL(null);
            }
            break;
        }
    }

    /**
     * Dispatches an event that occurred on the JavaScript side of the SDK to
     * the specified {@link JitsiMeetView}'s listener.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     * @param scope
     */
    @ReactMethod
    public void sendEvent(final String name,
                          final ReadableMap data,
                          final String scope) {
        // The JavaScript App needs to provide uniquely identifying information
        // to the native ExternalAPI module so that the latter may match the
        // former to the native JitsiMeetView which hosts it.
        JitsiMeetView view = JitsiMeetView.findViewByExternalAPIScope(scope);

        if (view == null) {
            return;
        }

        // XXX The JitsiMeetView property URL was introduced in order to address
        // an exception in the Picture-in-Picture functionality which arose
        // because of delays related to bridging between JavaScript and Java. To
        // reduce these delays do not wait for the call to be transfered to the
        // UI thread.
        maybeSetViewURL(name, data, view);

        // Make sure JitsiMeetView's listener is invoked on the UI thread. It
        // was requested by SDK consumers.
        if (UiThreadUtil.isOnUiThread()) {
            sendEventOnUiThread(name, data, scope);
        } else {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    sendEventOnUiThread(name, data, scope);
                }
            });
        }
    }

    /**
     * Dispatches an event that occurred on the JavaScript side of the SDK to
     * the specified {@link JitsiMeetView}'s listener on the UI thread.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     * @param scope
     */
    private void sendEventOnUiThread(final String name,
                          final ReadableMap data,
                          final String scope) {
        // The JavaScript App needs to provide uniquely identifying information
        // to the native ExternalAPI module so that the latter may match the
        // former to the native JitsiMeetView which hosts it.
        JitsiMeetView view = JitsiMeetView.findViewByExternalAPIScope(scope);

        if (view == null) {
            return;
        }

        JitsiMeetViewListener listener = view.getListener();

        if (listener == null) {
            return;
        }

        Method method = JITSI_MEET_VIEW_LISTENER_METHODS.get(name);

        if (method != null) {
            try {
                method.invoke(listener, toHashMap(data));
            } catch (IllegalAccessException e) {
                // FIXME There was a multicatch for IllegalAccessException and
                // InvocationTargetException, but Android Studio complained
                // with: "Multi-catch with these reflection exceptions requires
                // API level 19 (current min is 16) because they get compiled to
                // the common but new super type ReflectiveOperationException.
                // As a workaround either create individual catch statements, or
                // catch Exception."
                throw new RuntimeException(e);
            } catch (InvocationTargetException e) {
                throw new RuntimeException(e);
            }
        }
    }

    /**
     * Initializes a new {@code HashMap} instance with the key-value
     * associations of a specific {@code ReadableMap}.
     *
     * @param readableMap the {@code ReadableMap} specifying the key-value
     * associations with which the new {@code HashMap} instance is to be
     * initialized.
     * @return a new {@code HashMap} instance initialized with the key-value
     * associations of the specified {@code readableMap}.
     */
    private HashMap<String, Object> toHashMap(ReadableMap readableMap) {
        HashMap<String, Object> hashMap = new HashMap<>();

        for (ReadableMapKeySetIterator i = readableMap.keySetIterator();
                i.hasNextKey();) {
            String key = i.nextKey();

            hashMap.put(key, readableMap.getString(key));
        }

        return hashMap;
    }
}
