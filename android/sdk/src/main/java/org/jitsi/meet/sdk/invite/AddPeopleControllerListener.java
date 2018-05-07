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

import java.util.List;
import java.util.Map;

public interface AddPeopleControllerListener {
    /**
     * Called when the call to {@link AddPeopleController#inviteById(List)}
     * completes.
     *
     * @param addPeopleController the active {@link AddPeopleController} for
     * this invite flow.  This object should be cleaned up by calling
     * {@link AddPeopleController#endAddPeople()} if the user exits the invite
     * flow. Otherwise, it can stay active if the user will attempt to invite
     * @param failedInvitees a {@code List} of {@code Map<String, Object>}
     * dictionaries that represent the invitations that failed. The data type of
     * the objects is identical to the results returned in onReceivedResuls.
     */
    void onInviteSettled(
        AddPeopleController addPeopleController,
        List<Map<String, Object>> failedInvitees);

    /**
     * Called when results are received for a query called through
     * AddPeopleController.query().
     *
     * @param addPeopleController
     * @param results a List of Map<String, Object> objects that represent items
     * returned by the query. The object at key "type" describes the type of
     * item: "user", "videosipgw" (conference room), or "phone". "user" types
     * have properties at "id", "name", and "avatar". "videosipgw" types have
     * properties at "id" and "name". "phone" types have properties at "number",
     * "title", "and "subtitle"
     * @param query the query that generated the given results
     */
    void onReceivedResults(
        AddPeopleController addPeopleController,
        List<Map<String, Object>> results,
        String query);
}
