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

package org.jitsi.meet.sdk;

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
 * Utility methods for helping with transforming {@link ExternalAPIModule}
 * events into listener methods. Used with descendants of {@link BaseReactView}.
 */
public final class ListenerUtils {
    /**
     * Extracts the methods defined in a listener and creates a mapping of this
     * form: event name -> method.
     *
     * @param listener - The listener whose methods we want to slurp.
     * @return A mapping with event names - methods.
     */
    public static Map<String, Method> mapListenerMethods(Class listener) {
        Map<String, Method> methods = new HashMap<>();

        // Figure out the mapping between the listener methods
        // and the events i.e. redux action types.
        Pattern onPattern = Pattern.compile("^on[A-Z]+");
        Pattern camelcasePattern = Pattern.compile("([a-z0-9]+)([A-Z0-9]+)");

        for (Method method : listener.getDeclaredMethods()) {
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
            methods.put(name, method);
        }

        return methods;
    }

    /**
     * Executes the right listener method for the given event.
     * NOTE: This function will run asynchronously on the UI thread.
     *
     * @param listener - The listener on which the method will be called.
     * @param listenerMethods - Mapping with event names and the matching
     *                        methods.
     * @param eventName - Name of the event.
     * @param eventData - Data associated with the event.
     */
    public static void runListenerMethod(
            final Object listener,
            final Map<String, Method> listenerMethods,
            final String eventName,
            final ReadableMap eventData) {
        // Make sure listener methods are invoked on the UI thread. It
        // was requested by SDK consumers.
        if (UiThreadUtil.isOnUiThread()) {
            runListenerMethodOnUiThread(
                listener, listenerMethods, eventName, eventData);
        } else {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    runListenerMethodOnUiThread(
                        listener, listenerMethods, eventName, eventData);
                }
            });
        }
    }

    /**
     * Helper companion for {@link ListenerUtils#runListenerMethod} which runs
     * in the UI thread.
     */
    private static void runListenerMethodOnUiThread(
            Object listener,
            Map<String, Method> listenerMethods,
            String eventName,
            ReadableMap eventData) {
        UiThreadUtil.assertOnUiThread();

        Method method = listenerMethods.get(eventName);
        if (method != null) {
            try {
                method.invoke(listener, toHashMap(eventData));
            } catch (IllegalAccessException e) {
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
    private static HashMap<String, Object> toHashMap(ReadableMap readableMap) {
        HashMap<String, Object> hashMap = new HashMap<>();

        for (ReadableMapKeySetIterator i = readableMap.keySetIterator();
                i.hasNextKey();) {
            String key = i.nextKey();

            hashMap.put(key, readableMap.getString(key));
        }

        return hashMap;
    }
}
