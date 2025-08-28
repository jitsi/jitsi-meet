/*
 * Copyright @ 2019-present 8x8, Inc.
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

package org.jitsi.meet.sdk.log;

import timber.log.Timber;

public class JitsiMeetLogger {
    static {
        addHandler(new JitsiMeetDefaultLogHandler());
    }

    public static void addHandler(JitsiMeetBaseLogHandler handler) {
        if (!Timber.forest().contains(handler)) {
            try {
                Timber.plant(handler);
            } catch (Throwable t) {
                Timber.w(t, "Couldn't add log handler");
            }

        }
    }

    public static void removeHandler(JitsiMeetBaseLogHandler handler) {
        if (Timber.forest().contains(handler)) {
            try {
                Timber.uproot(handler);
            } catch (Throwable t) {
                Timber.w(t, "Couldn't remove log handler");
            }
        }
    }

    public static void v(String message, Object... args) {
        Timber.v(message, args);
    }

    public static void v(Throwable t, String message, Object... args) {
        Timber.v(t, message, args);
    }

    public static void v(Throwable t) {
        Timber.v(t);
    }

    public static void d(String message, Object... args) {
        Timber.d(message, args);
    }

    public static void d(Throwable t, String message, Object... args) {
        Timber.d(t, message, args);
    }

    public static void d(Throwable t) {
        Timber.d(t);
    }

    public static void i(String message, Object... args) {
        Timber.i(message, args);
    }

    public static void i(Throwable t, String message, Object... args) {
        Timber.i(t, message, args);
    }

    public static void i(Throwable t) {
        Timber.i(t);
    }

    public static void w(String message, Object... args) {
        Timber.w(message, args);
    }

    public static void w(Throwable t, String message, Object... args) {
        Timber.w(t, message, args);
    }

    public static void w(Throwable t) {
        Timber.w(t);
    }

    public static void e(String message, Object... args) {
        Timber.e(message, args);
    }

    public static void e(Throwable t, String message, Object... args) {
        Timber.e(t, message, args);
    }

    public static void e(Throwable t) {
        Timber.e(t);
    }

}
