/*
 * Copyright @ 2026-present 8x8, Inc.
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
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.DisplayMetricsHolder;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;

/**
 * Keeps React Native's {@link DisplayMetricsHolder} in sync with the display the UI is actually
 * shown on.
 *
 * React Native initializes {@link DisplayMetricsHolder} from the application {@link Context},
 * which reports the metrics of the default (built-in) display. Yoga, however, lays views out with
 * the density of the {@code Activity} the surface lives in. As soon as the {@code Activity} sits on
 * a display with another density (Samsung DeX, an external monitor, a desktop window) the two
 * disagree: boxes are sized for one density while text, borders and everything else that goes
 * through {@code PixelUtil} is sized for the other.
 */
final class DisplayMetricsSync {
    private static final String TAG = DisplayMetricsSync.class.getSimpleName();

    private DisplayMetricsSync() {
    }

    /**
     * Points {@link DisplayMetricsHolder} at the metrics of the given UI {@link Context}.
     *
     * @param context a visual {@link Context}, i.e. the {@code Activity} hosting the React surface.
     * @return {@code true} if the metrics known to React Native changed.
     */
    @SuppressWarnings("deprecation")
    static boolean apply(@NonNull Context context) {
        // A live object: Android updates it in place on configuration changes.
        DisplayMetrics window = context.getResources().getDisplayMetrics();
        DisplayMetrics screen = new DisplayMetrics();

        screen.setTo(window);

        try {
            Display display
                = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? context.getDisplay()
                    : ((WindowManager) context.getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay();

            if (display != null) {
                display.getRealMetrics(screen);
            }
        } catch (RuntimeException e) {
            JitsiMeetLogger.w(e, TAG + " Cannot read the metrics of the display, using the window's");
        }

        // Layout happens with the density of the window's resources, so that is the one everything
        // else has to agree with.
        screen.density = window.density;
        screen.densityDpi = window.densityDpi;
        screen.scaledDensity = window.scaledDensity;
        screen.xdpi = window.xdpi;
        screen.ydpi = window.ydpi;

        DisplayMetrics previousWindow = getOrNull(true);
        DisplayMetrics previousScreen = getOrNull(false);

        if (previousWindow == window && screen.equals(previousScreen)) {
            return false;
        }

        DisplayMetricsHolder.setWindowDisplayMetrics(window);
        DisplayMetricsHolder.setScreenDisplayMetrics(screen);

        return true;
    }

    private static DisplayMetrics getOrNull(boolean window) {
        try {
            return window
                ? DisplayMetricsHolder.getWindowDisplayMetrics()
                : DisplayMetricsHolder.getScreenDisplayMetrics();
        } catch (RuntimeException e) {
            // Not initialized yet.
            return null;
        }
    }
}
