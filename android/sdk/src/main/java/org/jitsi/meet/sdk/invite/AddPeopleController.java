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
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller object used by native code to query and submit user selections for
 * the user invitation flow.
 */
public class AddPeopleController {

    /**
     * The AddPeopleControllerListener for this controller, used to pass query
     * results back to the native code that initiated the query.
     */
    private AddPeopleControllerListener listener;

    /**
     * Local cache of search query results. Used to re-hydrate the list of
     * selected items based on their ids passed to inviteById in order to pass
     * the full item maps back to the JitsiMeetView during submission.
     */
    private final Map<String, ReadableMap> items = new HashMap<>();

    private final WeakReference<InviteController> owner;

    private final WeakReference<ReactApplicationContext> reactContext;

    /**
     * Randomly generated UUID, used for identification in the InviteModule.
     */
    private final String uuid = UUID.randomUUID().toString();

    public AddPeopleController(
            InviteController owner,
            ReactApplicationContext reactContext) {
        this.owner = new WeakReference<>(owner);
        this.reactContext = new WeakReference<>(reactContext);
    }

    /**
     * Cancel the invitation flow and free memory allocated to the
     * AddPeopleController. After calling this method, this object is invalid -
     * a new AddPeopleController will be passed to the caller through
     * beginAddPeople.
     */
    public void endAddPeople() {
        InviteController owner = this.owner.get();

        if (owner != null) {
            owner.endAddPeople(this);
        }
    }

    /**
     *
     * @return the AddPeopleControllerListener for this controller, used to pass
     * query results back to the native code that initiated the query.
     */
    public AddPeopleControllerListener getListener() {
        return listener;
    }

    final ReactApplicationContext getReactApplicationContext() {
        return reactContext.get();
    }

    /**
     *
     * @return the unique identifier for this AddPeopleController
     */
    public String getUuid() {
        return uuid;
    }

    /**
     * Send invites to selected users based on their item ids
     *
     * @param ids
     */
    public void inviteById(List<String> ids) {
        InviteController owner = this.owner.get();

        if (owner != null) {
            WritableArray invitees = new WritableNativeArray();

            for(int i = 0, size = ids.size(); i < size; i++) {
                String id = ids.get(i);

                if(items.containsKey(id)) {
                    WritableNativeMap map = new WritableNativeMap();
                    map.merge(items.get(id));
                    invitees.pushMap(map);
                } else {
                    // If the id doesn't exist in the map, we can't do anything,
                    // so just skip it.
                }
            }

            owner.invite(this, invitees);
        }
    }

    void inviteSettled(ReadableArray failedInvitees) {
        AddPeopleControllerListener listener = getListener();

        if (listener != null) {
            ArrayList<Map<String, Object>> jFailedInvitees = new ArrayList<>();

            for (int i = 0, size = failedInvitees.size(); i < size; ++i) {
                jFailedInvitees.add(failedInvitees.getMap(i).toHashMap());
            }

            listener.onInviteSettled(this, jFailedInvitees);
        }
    }

    /**
     * Start a search for entities to invite with the given query. Results will
     * be returned through the associated AddPeopleControllerListener's
     * onReceivedResults method.
     *
     * @param query
     */
    public void performQuery(String query) {
        InviteController owner = this.owner.get();

        if (owner != null) {
            owner.performQuery(this, query);
        }
    }

    /**
     * Caches results received by the search into a local map for use later when
     * the items are submitted.  Submission requires the full map of
     * information, but only the IDs are returned back to the delegate. Using
     * this map means we don't have to send the whole map back to the delegate.
     *
     * @param results
     * @param query
     */
    void receivedResultsForQuery(ReadableArray results, String query) {
        AddPeopleControllerListener listener = getListener();

        if (listener != null) {
            List<Map<String, Object>> jvmResults = new ArrayList<>();

            // cache results for use in submission later
            // convert to jvm array
            for(int i = 0; i < results.size(); i++) {
                ReadableMap map = results.getMap(i);

                if(map.hasKey("id")) {
                    items.put(map.getString("id"), map);
                } else if(map.hasKey("type")
                        && map.getString("type").equals("phone")
                        && map.hasKey("number")) {
                    items.put(map.getString("number"), map);
                } else {
                    Log.w(
                        "AddPeopleController",
                        "Received result without id and that was not a phone number, so not adding it to suggestions: "
                            + map);
                }

                jvmResults.add(map.toHashMap());
            }

            listener.onReceivedResults(this, jvmResults, query);
        }
    }

    /**
     * Sets the AddPeopleControllerListener for this controller, used to pass
     * query results back to the native code that initiated the query.
     *
     * @param listener
     */
    public void setListener(AddPeopleControllerListener listener) {
        this.listener = listener;
    }
}
