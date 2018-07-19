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

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeMap;

import org.jitsi.meet.sdk.ReactContextUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;

/**
 * Represents the entry point into the invite feature of Jitsi Meet and is the
 * Java counterpart of the JavaScript {@code InviteButton}.
 */
public class InviteController {
    private AddPeopleController addPeopleController;

    /**
     * Whether adding/inviting people by name (as opposed to phone number) is
     * enabled.
     */
    private Boolean addPeopleEnabled;

    /**
     * Whether adding/inviting people by phone number (as opposed to name) is
     * enabled.
     */
    private Boolean dialOutEnabled;

    private final String externalAPIScope;

    private InviteControllerListener listener;

    public InviteController(String externalAPIScope) {
        this.externalAPIScope = externalAPIScope;
    }

    void beginAddPeople(ReactApplicationContext reactContext) {
        InviteControllerListener listener = getListener();

        if (listener != null) {
            // XXX For the sake of simplicity and in order to reduce the risk of
            // memory leaks, allow a single AddPeopleController at a time.
            AddPeopleController addPeopleController = this.addPeopleController;

            if (addPeopleController != null) {
                return;
            }

            // Initialize a new AddPeopleController to represent the click/tap
            // on the InviteButton and notify the InviteControllerListener
            // about the event.
            addPeopleController = new AddPeopleController(this, reactContext);

            boolean success = false;

            this.addPeopleController = addPeopleController;
            try {
                listener.beginAddPeople(addPeopleController);
                success = true;
            } finally {
                if (!success) {
                    endAddPeople(addPeopleController);
                }
            }
        }
    }

    void endAddPeople(AddPeopleController addPeopleController) {
        if (this.addPeopleController == addPeopleController) {
            this.addPeopleController = null;
        }
    }

    public InviteControllerListener getListener() {
        return listener;
    }

    /**
     * Sends JavaScript event to submit invitations to the given item ids
     *
     * @param invitees a WritableArray of WritableNativeMaps representing
     * selected items. Each map representing a selected item should match the
     * data passed back in the return from a query.
     */
    boolean invite(
            AddPeopleController addPeopleController,
            WritableArray invitees) {
        return
            invite(
                addPeopleController.getUuid(),
                addPeopleController.getReactApplicationContext(),
                invitees);
    }

    public Future<List<Map<String, Object>>> invite(
            final List<Map<String, Object>> invitees) {
        final boolean inviteBegan
            = invite(
                UUID.randomUUID().toString(),
                /* reactContext */ null,
                Arguments.makeNativeArray(invitees));
        FutureTask futureTask
            = new FutureTask(new Callable() {
                @Override
                public List<Map<String, Object>> call() {
                    if (inviteBegan) {
                        // TODO Complete the returned Future when the invite
                        // settles.
                        return Collections.emptyList();
                    } else {
                        // The invite failed to even begin so report that all
                        // invitees failed.
                        return invitees;
                    }
                }
            });

        // If the invite failed to even begin, complete the returned Future
        // already and the Future implementation will report that all invitees
        // failed.
        if (!inviteBegan) {
            futureTask.run();
        }

        return futureTask;
    }

    private boolean invite(
            String addPeopleControllerScope,
            ReactContext reactContext,
            WritableArray invitees) {
        WritableNativeMap data = new WritableNativeMap();

        data.putString("addPeopleControllerScope", addPeopleControllerScope);
        data.putString("externalAPIScope", externalAPIScope);
        data.putArray("invitees", invitees);

        return
            ReactContextUtils.emitEvent(
                reactContext,
                "org.jitsi.meet:features/invite#invite",
                data);
    }

    void inviteSettled(
            String addPeopleControllerScope,
            ReadableArray failedInvitees) {
        AddPeopleController addPeopleController = this.addPeopleController;

        if (addPeopleController != null
                && addPeopleController.getUuid().equals(
                    addPeopleControllerScope)) {
            try {
                addPeopleController.inviteSettled(failedInvitees);
            } finally {
                if (failedInvitees.size() == 0) {
                    endAddPeople(addPeopleController);
                }
            }
        }
    }

    public boolean isAddPeopleEnabled() {
        Boolean b = this.addPeopleEnabled;

        return
            (b == null || b.booleanValue()) ? (getListener() != null) : false;
    }

    public boolean isDialOutEnabled() {
        Boolean b = this.dialOutEnabled;

        return
            (b == null || b.booleanValue()) ? (getListener() != null) : false;
    }

    /**
     * Starts a query for users to invite to the conference. Results will be
     * returned through
     * {@link AddPeopleControllerListener#onReceivedResults(AddPeopleController, List, String)}.
     *
     * @param query {@code String} to use for the query
     */
    void performQuery(AddPeopleController addPeopleController, String query) {
        WritableNativeMap params = new WritableNativeMap();

        params.putString("addPeopleControllerScope", addPeopleController.getUuid());
        params.putString("externalAPIScope", externalAPIScope);
        params.putString("query", query);
        ReactContextUtils.emitEvent(
            addPeopleController.getReactApplicationContext(),
            "org.jitsi.meet:features/invite#performQuery",
            params);
    }

    void receivedResultsForQuery(
            String addPeopleControllerScope,
            String query,
            ReadableArray results) {
        AddPeopleController addPeopleController = this.addPeopleController;

        if (addPeopleController != null
                && addPeopleController.getUuid().equals(
                    addPeopleControllerScope)) {
            addPeopleController.receivedResultsForQuery(results, query);
        }
    }

    /**
     * Sets whether the ability to add users to the call is enabled. If this is
     * enabled, an add user button will appear on the {@link JitsiMeetView}. If
     * enabled, and the user taps the add user button,
     * {@link InviteControllerListener#beginAddPeople(AddPeopleController)}
     * will be called.
     *
     * @param addPeopleEnabled {@code true} to enable the add people button;
     * otherwise, {@code false}
     */
    public void setAddPeopleEnabled(boolean addPeopleEnabled) {
        this.addPeopleEnabled = Boolean.valueOf(addPeopleEnabled);
    }

    /**
     * Sets whether the ability to add phone numbers to the call is enabled.
     * Must be enabled along with {@link #setAddPeopleEnabled(boolean)} to be
     * effective.
     *
     * @param dialOutEnabled {@code true} to enable the ability to add phone
     * numbers to the call; otherwise, {@code false}
     */
    public void setDialOutEnabled(boolean dialOutEnabled) {
        this.dialOutEnabled = Boolean.valueOf(dialOutEnabled);
    }

    public void setListener(InviteControllerListener listener) {
        this.listener = listener;
    }
}
