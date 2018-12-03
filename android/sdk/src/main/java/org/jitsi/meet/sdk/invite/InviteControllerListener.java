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

public interface InviteControllerListener {
    /**
     * Called when the add user button is tapped.
     *
     * @param addPeopleController {@code AddPeopleController} scoped for this
     * user invite flow. The {@code AddPeopleController} is used to start user
     * queries and accepts an {@code AddPeopleControllerListener} for receiving
     * user query responses.
     */
    void beginAddPeople(AddPeopleController addPeopleController);
}
