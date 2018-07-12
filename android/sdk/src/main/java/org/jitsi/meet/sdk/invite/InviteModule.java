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

package org.jitsi.meet.sdk.invite;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.UiThreadUtil;

import org.jitsi.meet.sdk.BaseReactView;
import org.jitsi.meet.sdk.JitsiMeetView;

/**
 * Implements the react-native module of the feature invite.
 */
public class InviteModule extends ReactContextBaseJavaModule {
    public InviteModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Signals that a click/tap has been performed on {@code InviteButton} and
     * that the execution flow for adding/inviting people to the current
     * conference/meeting is to begin
     *
     * @param externalAPIScope the unique identifier of the
     * {@code JitsiMeetView} whose {@code InviteButton} was clicked/tapped.
     */
    @ReactMethod
    public void beginAddPeople(final String externalAPIScope) {
        // Make sure InviteControllerListener (like all other listeners of the
        // SDK) is invoked on the UI thread. It was requested by SDK consumers.
        if (!UiThreadUtil.isOnUiThread()) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    beginAddPeople(externalAPIScope);
                }
            });
            return;
        }

        InviteController inviteController
            = findInviteControllerByExternalAPIScope(externalAPIScope);

        if (inviteController != null) {
            inviteController.beginAddPeople(getReactApplicationContext());
        }
    }

    private InviteController findInviteControllerByExternalAPIScope(
            String externalAPIScope) {
        JitsiMeetView view
            = (JitsiMeetView)BaseReactView.findViewByExternalAPIScope(externalAPIScope);

        return view == null ? null : view.getInviteController();
    }

    @Override
    public String getName() {
        return "Invite";
    }

    /**
     * Callback for invitation failures
     *
     * @param failedInvitees the items for which the invitation failed
     * @param addPeopleControllerScope a string that represents a connection to a specific AddPeopleController
     */
    @ReactMethod
    public void inviteSettled(
            final String externalAPIScope,
            final String addPeopleControllerScope,
            final ReadableArray failedInvitees) {
        // Make sure AddPeopleControllerListener (like all other listeners of
        // the SDK) is invoked on the UI thread. It was requested by SDK
        // consumers.
        if (!UiThreadUtil.isOnUiThread()) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    inviteSettled(
                        externalAPIScope, 
                        addPeopleControllerScope,
                        failedInvitees);
                }
            });
            return;
        }

        InviteController inviteController
            = findInviteControllerByExternalAPIScope(externalAPIScope);

        if (inviteController == null) {
            Log.w(
                "InviteModule",
                "Invite settled, but failed to find active controller to notify");
        } else {
            inviteController.inviteSettled(
                addPeopleControllerScope,
                failedInvitees);
        }
    }

    /**
     * Callback for results received from the JavaScript invite search call
     *
     * @param results the results in a ReadableArray of ReadableMap objects
     * @param query the query associated with the search
     * @param addPeopleControllerScope a string that represents a connection to a specific AddPeopleController
     */
    @ReactMethod
    public void receivedResults(
            final String externalAPIScope,
            final String addPeopleControllerScope,
            final String query,
            final ReadableArray results) {
        // Make sure AddPeopleControllerListener (like all other listeners of
        // the SDK) is invoked on the UI thread. It was requested by SDK
        // consumers.
        if (!UiThreadUtil.isOnUiThread()) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    receivedResults(
                        externalAPIScope,
                        addPeopleControllerScope,
                        query,
                        results);
                }
            });
            return;
        }

        InviteController inviteController
            = findInviteControllerByExternalAPIScope(externalAPIScope);

        if (inviteController == null) {
            Log.w(
                "InviteModule",
                "Received results, but failed to find active controller to send results back");
        } else {
            inviteController.receivedResultsForQuery(
                addPeopleControllerScope,
                query,
                results);
        }
    }
}
