package org.jitsi.meet.sdk;

import android.util.Log;

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
 * Controller object used by native code to query and submit user selections for the user invitation flow.
 */
public class InviteSearchController {

    /**
     * The InviteSearchControllerDelegate for this controller, used to pass query
     * results back to the native code that initiated the query.
     */
    private InviteSearchControllerDelegate searchControllerDelegate;

    /**
     * Local cache of search query results.  Used to re-hydrate the list
     * of selected items based on their ids passed to submitSelectedItemIds
     * in order to pass the full item maps back to the JitsiMeetView during submission.
     */
    private Map<String, ReadableMap> items = new HashMap<>();

    /**
     * Randomly generated UUID, used for identification in the InviteSearchModule
     */
    private String uuid = UUID.randomUUID().toString();

    private WeakReference<InviteSearchModule> parentModuleRef;

    public InviteSearchController(InviteSearchModule module) {
        parentModuleRef = new WeakReference<>(module);
    }

    /**
     * Start a search for entities to invite with the given query.
     * Results will be returned through the associated InviteSearchControllerDelegate's
     * onReceiveResults method.
     *
     * @param query
     */
    public void performQuery(String query) {
        JitsiMeetView.onInviteQuery(query, uuid);
    }

    /**
     * Send invites to selected users based on their item ids
     *
     * @param ids
     */
    public void submitSelectedItemIds(List<String> ids) {
        WritableArray selectedItems = new WritableNativeArray();
        for(int i=0; i<ids.size(); i++) {
            if(items.containsKey(ids.get(i))) {
                WritableNativeMap map = new WritableNativeMap();
                map.merge(items.get(ids.get(i)));
                selectedItems.pushMap(map);
            } else {
                // if the id doesn't exist in the map, we can't do anything, so just skip it
            }
        }

        JitsiMeetView.submitSelectedItems(selectedItems, uuid);
    }

    /**
     * Caches results received by the search into a local map for use
     * later when the items are submitted.  Submission requires the full
     * map of information, but only the IDs are returned back to the delegate.
     * Using this map means we don't have to send the whole map back to the delegate.
     *
     * @param results
     * @param query
     */
    void receivedResultsForQuery(ReadableArray results, String query) {

        List<Map<String, Object>> jvmResults = new ArrayList<>();
        // cache results for use in submission later
        // convert to jvm array
        for(int i=0; i<results.size(); i++) {
            ReadableMap map = results.getMap(i);
            if(map.hasKey("id")) {
                items.put(map.getString("id"), map);
            } else if(map.hasKey("type") && map.getString("type").equals("phone") && map.hasKey("number")) {
                items.put(map.getString("number"), map);
            } else {
                Log.w("InviteSearchController", "Received result without id and that was not a phone number, so not adding it to suggestions: " + map);
            }

            jvmResults.add(map.toHashMap());
        }


        searchControllerDelegate.onReceiveResults(this, jvmResults, query);
    }

    /**
     *
     * @return the InviteSearchControllerDelegate for this controller, used to pass query
     * results back to the native code that initiated the query.
     */
    public InviteSearchControllerDelegate getSearchControllerDelegate() {
        return searchControllerDelegate;
    }

    /**
     * Sets the InviteSearchControllerDelegate for this controller, used to pass query results
     * back to the native code that initiated the query.
     *
     * @param searchControllerDelegate
     */
    public void setSearchControllerDelegate(InviteSearchControllerDelegate searchControllerDelegate) {
        this.searchControllerDelegate = searchControllerDelegate;
    }

    /**
     * Cancel the invitation flow and free memory allocated to the InviteSearchController.  After
     * calling this method, this object is invalid - a new InviteSearchController will be passed
     * to the caller through launchNativeInvite.
     */
    public void cancelSearch() {
        InviteSearchModule parentModule = parentModuleRef.get();
        if(parentModule != null) {
            parentModule.removeSearchController(uuid);
        }
    }

    /**
     * @return the unique identifier for this InviteSearchController
     */
    public String getUuid() {
        return uuid;
    }

    public interface InviteSearchControllerDelegate {
        /**
         * Called when results are received for a query called through InviteSearchController.query()
         *
         * @param searchController
         * @param results a List of Map<String, Object> objects that represent items returned by the query.
         *                The object at key "type" describes the type of item: "user", "videosipgw" (conference room), or "phone".
         *                "user" types have properties at "id", "name", and "avatar"
         *                "videosipgw" types have properties at "id" and "name"
         *                "phone" types have properties at "number", "title", "and "subtitle"
         * @param query the query that generated the given results
         */
        void onReceiveResults(InviteSearchController searchController, List<Map<String, Object>> results, String query);

        /**
         * Called when the call to {@link InviteSearchController#submitSelectedItemIds(List)} completes successfully
         * and invitations are sent to all given IDs.
         *
         * @param searchController the active {@link InviteSearchController} for this invite flow.  This object will be
         *                         cleaned up after the call to inviteSucceeded completes.
         */
        void inviteSucceeded(InviteSearchController searchController);

        /**
         * Called when the call to {@link InviteSearchController#submitSelectedItemIds(List)} completes, but the
         * invitation fails for one or more of the selected items.
         *
         * @param searchController the active {@link InviteSearchController} for this invite flow.  This object
         *                         should be cleaned up by calling {@link InviteSearchController#cancelSearch()} if
         *                         the user exits the invite flow.  Otherwise, it can stay active if the user
         *                         will attempt to invite
         * @param failedInviteItems a {@code List} of {@code Map<String, Object>} dictionaries that represent the
         *                          invitations that failed.  The data type of the objects is identical to the results
         *                          returned in onReceiveResuls.
         */
        void inviteFailed(InviteSearchController searchController, List<Map<String, Object>> failedInviteItems);
    }
}