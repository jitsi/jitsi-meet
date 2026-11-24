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

import android.app.Activity;

import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;

import java.lang.ref.WeakReference;

/**
 * Defines the default behavior of {@code JitsiMeetFragment} and
 * {@code JitsiMeetView} upon invoking the back button if no
 * {@code JitsiMeetView} handles the invocation. For example, a
 * {@code JitsiMeetView} may (1) handle the invocation of the back button
 * during a conference by leaving the conference and (2) not handle the
 * invocation when not in a conference.
 */
class DefaultHardwareBackBtnHandlerImpl implements DefaultHardwareBackBtnHandler {

    /**
     * Weak reference to the {@code Activity} to which the default handling of
     * the back button is being provided by this instance. Weak so the
     * instance can outlive the Activity (it is cached for reuse across
     * {@code onHostResume} calls).
     */
    private final WeakReference<Activity> activityRef;

    public DefaultHardwareBackBtnHandlerImpl(Activity activity) {
        this.activityRef = new WeakReference<>(activity);
    }

    Activity getActivity() {
        return activityRef.get();
    }

    /**
     * {@inheritDoc}
     *
     * Finishes the associated {@code Activity}.
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        // Technically, we'd like to invoke Activity#onBackPressed().
        // Practically, it's not possible. Fortunately, the documentation of
        // Activity#onBackPressed() specifies that "[t]he default implementation
        // simply finishes the current activity,"
        Activity activity = activityRef.get();
        if (activity != null) {
            activity.finish();
        }
    }
}
