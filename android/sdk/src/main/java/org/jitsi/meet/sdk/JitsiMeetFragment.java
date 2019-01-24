/*
 * Copyright @ 2019-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
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

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.net.URL;

/**
 * Base Activity for applications integrating Jitsi Meet at a higher level. It
 * contains all the required wiring between the {@code JitsiMeetView} and
 * the Activity lifecycle methods already implemented.
 *
 * In this activity we use a single {@code JitsiMeetView} instance. This
 * instance gives us access to a view which displays the welcome page and the
 * conference itself. All lifetime methods associated with this Activity are
 * hooked to the React Native subsystem via proxy calls through the
 * {@code JitsiMeetView} static methods.
 */
public class JitsiMeetFragment extends Fragment {

    /**
     * A color scheme object to override the default color is the SDK.
     */
    private Bundle colorScheme;

    /**
     * The default base {@code URL} used to join a conference when a partial URL
     * (e.g. a room name only) is specified. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private URL defaultURL;

    /**
     * Instance of the {@link JitsiMeetView} which this activity will display.
     */
    private JitsiMeetView view;

    /**
     * Whether Picture-in-Picture is enabled. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private Boolean pictureInPictureEnabled;

    /**
     * Whether the Welcome page is enabled. The value is used only while
     * {@link #view} equals {@code null}.
     */
    private boolean welcomePageEnabled;

    /**
     *
     * @see JitsiMeetView#getDefaultURL()
     */
    public URL getDefaultURL() {
        return view == null ? defaultURL : view.getDefaultURL();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        this.view = initializeView();

        return this.view;
    }

    /**
     * Initializes a new {@link JitsiMeetView} instance.
     *
     * @return a new {@code JitsiMeetView} instance.
     */
    protected JitsiMeetView initializeView() {
        JitsiMeetView view = new JitsiMeetView(getActivity());

        // XXX Before calling JitsiMeetView#loadURL, make sure to call whatever
        // is documented to need such an order in order to take effect:
        view.setColorScheme(colorScheme);
        view.setDefaultURL(defaultURL);
        if (pictureInPictureEnabled != null) {
            view.setPictureInPictureEnabled(
                pictureInPictureEnabled.booleanValue());
        }
        view.setWelcomePageEnabled(welcomePageEnabled);

        return view;
    }

    /**
     *
     * @see JitsiMeetView#isPictureInPictureEnabled()
     */
    public boolean isPictureInPictureEnabled() {
        return
            view == null
                ? pictureInPictureEnabled
                : view.isPictureInPictureEnabled();
    }

    /**
     *
     * @see JitsiMeetView#isWelcomePageEnabled()
     */
    public boolean isWelcomePageEnabled() {
        return view == null ? welcomePageEnabled : view.isWelcomePageEnabled();
    }

    /**
     * Loads the given URL and displays the conference. If the specified URL is
     * null, the welcome page is displayed instead.
     *
     * @param url The conference URL.
     */
    public void loadURL(@Nullable String url) {
        view.loadURLString(url);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        JitsiMeetActivityDelegate.onActivityResult(
                getActivity(), requestCode, resultCode, data);
    }

    @Override
    public void onDestroyView() {
        if (view != null) {
            view.dispose();
            view = null;
        }

        super.onDestroyView();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        JitsiMeetActivityDelegate.onHostDestroy(getActivity());
    }

    // https://developer.android.com/reference/android/support/v4/app/ActivityCompat.OnRequestPermissionsResultCallback
    @Override
    public void onRequestPermissionsResult(
            final int requestCode,
            final String[] permissions,
            final int[] grantResults) {
        JitsiMeetActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    public void onResume() {
        super.onResume();

        JitsiMeetActivityDelegate.onHostResume(getActivity());
    }

    @Override
    public void onStop() {
        super.onStop();

        JitsiMeetActivityDelegate.onHostPause(getActivity());
    }

    public void enterPictureInPicture() {
        if (view != null) {
            view.enterPictureInPicture();
        }
    }

    /**
     *
     * @see JitsiMeetView#setColorScheme(Bundle)
     */
    public void setColorScheme(Bundle colorScheme) {
        if (view == null) {
            this.colorScheme = colorScheme;
        } else {
            view.setColorScheme(colorScheme);
        }
    }

    /**
     *
     * @see JitsiMeetView#setDefaultURL(URL)
     */
    public void setDefaultURL(URL defaultURL) {
        if (view == null) {
            this.defaultURL = defaultURL;
        } else {
            view.setDefaultURL(defaultURL);
        }
    }

    /**
     *
     * @see JitsiMeetView#setPictureInPictureEnabled(boolean)
     */
    public void setPictureInPictureEnabled(boolean pictureInPictureEnabled) {
        if (view == null) {
            this.pictureInPictureEnabled
                = Boolean.valueOf(pictureInPictureEnabled);
        } else {
            view.setPictureInPictureEnabled(pictureInPictureEnabled);
        }
    }

    /**
     *
     * @see JitsiMeetView#setWelcomePageEnabled(boolean)
     */
    public void setWelcomePageEnabled(boolean welcomePageEnabled) {
        if (view == null) {
            this.welcomePageEnabled = welcomePageEnabled;
        } else {
            view.setWelcomePageEnabled(welcomePageEnabled);
        }
    }
}
