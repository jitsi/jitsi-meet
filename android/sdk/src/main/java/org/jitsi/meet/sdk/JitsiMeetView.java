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

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.AttributeSet;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.ReactRootView;

import org.jitsi.meet.sdk.log.JitsiMeetLogger;


public class JitsiMeetView extends FrameLayout {

    /**
     * Background color. Should match the background color set in JS.
     */
    private static final int BACKGROUND_COLOR = 0xFF040404;

    /**
     * React Native root view.
     */
    private ReactRootView reactRootView;

    /**
     * Helper method to recursively merge 2 {@link Bundle} objects representing React Native props.
     *
     * @param a - The first {@link Bundle}.
     * @param b - The second {@link Bundle}.
     * @return The merged {@link Bundle} object.
     */
    private static Bundle mergeProps(@Nullable Bundle a, @Nullable Bundle b) {
        Bundle result = new Bundle();

        if (a == null) {
            if (b != null) {
                result.putAll(b);
            }

            return result;
        }

        if (b == null) {
            result.putAll(a);

            return result;
        }

        // Start by putting all of a in the result.
        result.putAll(a);

        // Iterate over each key in b and override if appropriate.
        for (String key : b.keySet()) {
            Object bValue = b.get(key);
            Object aValue = a.get(key);
            String valueType = bValue.getClass().getSimpleName();

            if (valueType.contentEquals("Boolean")) {
                result.putBoolean(key, (Boolean)bValue);
            } else if (valueType.contentEquals("String")) {
                result.putString(key, (String)bValue);
            } else if (valueType.contentEquals("Integer")) {
                result.putInt(key, (int)bValue);
            } else if (valueType.contentEquals("Bundle")) {
                result.putBundle(key, mergeProps((Bundle)aValue, (Bundle)bValue));
            } else {
                throw new RuntimeException("Unsupported type: " + valueType);
            }
        }

        return result;
    }

    public JitsiMeetView(@NonNull Context context) {
        super(context);
        initialize(context);
    }

    public JitsiMeetView(Context context, AttributeSet attrs) {
        super(context, attrs);
        initialize(context);
    }

    public JitsiMeetView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        initialize(context);
    }

    /**
     * Releases the React resources (specifically the {@link ReactRootView})
     * associated with this view.
     *
     * MUST be called when the {@link Activity} holding this view is destroyed,
     * typically in the {@code onDestroy} method.
     */
    public void dispose() {
        if (reactRootView != null) {
            removeView(reactRootView);
            reactRootView.unmountReactApplication();
            reactRootView = null;
        }
    }

    /**
     * Enters Picture-In-Picture mode, if possible. This method is designed to
     * be called from the {@code Activity.onUserLeaveHint} method.
     *
     * This is currently not mandatory, but if used will provide automatic
     * handling of the picture in picture mode when user minimizes the app. It
     * will be probably the most useful in case the app is using the welcome
     * page.
     */
    public void enterPictureInPicture() {
        PictureInPictureModule pipModule
            = ReactInstanceManagerHolder.getNativeModule(
                PictureInPictureModule.class);
        if (pipModule != null
                && pipModule.isPictureInPictureSupported()
                && !JitsiMeetActivityDelegate.arePermissionsBeingRequested()) {
            try {
                pipModule.enterPictureInPicture();
            } catch (RuntimeException re) {
                JitsiMeetLogger.e(re, "Failed to enter PiP mode");
            }
        }
    }

    /**
     * Joins the conference specified by the given {@link JitsiMeetConferenceOptions}. If there is
     * already an active conference, it will be left and the new one will be joined.
     * @param options - Description of what conference must be joined and what options will be used
     *                when doing so.
     */
    public void join(@Nullable JitsiMeetConferenceOptions options) {
        setProps(options != null ? options.asProps() : new Bundle());
    }

    /**
     * Internal method which aborts running RN by passing empty props.
     * This is only meant to be used from the enclosing Activity's onDestroy.
     */
    public void abort() {
        setProps(new Bundle());
    }

    /**
     * Creates the {@code ReactRootView} for the given app name with the given
     * props. Once created it's set as the view of this {@code FrameLayout}.
     *
     * @param appName - The name of the "app" (in React Native terms) to load.
     * @param props - The React Component props to pass to the app.
     */
    private void createReactRootView(String appName, @Nullable Bundle props) {
        if (props == null) {
            props = new Bundle();
        }

        if (reactRootView == null) {
            reactRootView = new ReactRootView(getContext());
            reactRootView.startReactApplication(
                ReactInstanceManagerHolder.getReactInstanceManager(),
                appName,
                props);
            reactRootView.setBackgroundColor(BACKGROUND_COLOR);
            addView(reactRootView);
        } else {
            reactRootView.setAppProperties(props);
        }
    }

    private void initialize(@NonNull Context context) {
        // Check if the parent Activity implements JitsiMeetActivityInterface,
        // otherwise things may go wrong.
        if (!(context instanceof JitsiMeetActivityInterface)) {
            throw new RuntimeException("Enclosing Activity must implement JitsiMeetActivityInterface");
        }

        setBackgroundColor(BACKGROUND_COLOR);

        ReactInstanceManagerHolder.initReactInstanceManager((Activity) context);
    }

    /**
     * Helper method to set the React Native props.
     * @param newProps - New props to be set on the React Native view.
     */
    private void setProps(@NonNull Bundle newProps) {
        // Merge the default options with the newly provided ones.
        Bundle props = mergeProps(JitsiMeet.getDefaultProps(), newProps);

        // XXX The setProps() method is supposed to be imperative i.e.
        // a second invocation with one and the same URL is expected to join
        // the respective conference again if the first invocation was followed
        // by leaving the conference. However, React and, respectively,
        // appProperties/initialProperties are declarative expressions i.e. one
        // and the same URL will not trigger an automatic re-render in the
        // JavaScript source code. The workaround implemented below introduces
        // "imperativeness" in React Component props by defining a unique value
        // per setProps() invocation.
        props.putLong("timestamp", System.currentTimeMillis());

        createReactRootView("App", props);
    }

    @Override
    protected void onDetachedFromWindow() {
        dispose();
        super.onDetachedFromWindow();
    }
}
