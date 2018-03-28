package org.jitsi.meet.sdk;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Native module for Invite Search
 */
class InviteSearchModule extends ReactContextBaseJavaModule {

    /**
     * Map of InviteSearchController objects passed to connected JitsiMeetView.
     * A call to launchNativeInvite will create a new InviteSearchController and pass
     * it back to the caller.  On a successful invitation, the controller will be removed automatically.
     * On a failed invitation, the caller has the option of calling InviteSearchController#cancelSearch()
     * to remove the controller from this map.  The controller should also be removed if the user cancels
     * the invitation flow.
     */
    private Map<String, InviteSearchController> searchControllers = new HashMap<>();

    public InviteSearchModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Launch the native user invite flow
     *
     * @param externalAPIScope a string that represents a connection to a specific JitsiMeetView
     */
    @ReactMethod
    public void launchNativeInvite(String externalAPIScope) {
        JitsiMeetView viewToLaunchInvite = JitsiMeetView.findViewByExternalAPIScope(externalAPIScope);

        if(viewToLaunchInvite == null) {
            return;
        }

        if(viewToLaunchInvite.getListener() == null) {
            return;
        }

        InviteSearchController controller = createSearchController();
        viewToLaunchInvite.getListener().launchNativeInvite(controller);
    }

    /**
     * Callback for results received from the JavaScript invite search call
     *
     * @param results the results in a ReadableArray of ReadableMap objects
     * @param query the query associated with the search
     * @param inviteSearchControllerScope a string that represents a connection to a specific InviteSearchController
     */
    @ReactMethod
    public void receivedResults(ReadableArray results, String query, String inviteSearchControllerScope) {
        InviteSearchController controller = searchControllers.get(inviteSearchControllerScope);

        if(controller == null) {
            Log.w("InviteSearchModule", "Received results, but unable to find active controller to send results back");
            return;
        }

        controller.receivedResultsForQuery(results, query);

    }

    /**
     * Callback for invitation failures
     *
     * @param items the items for which the invitation failed
     * @param inviteSearchControllerScope a string that represents a connection to a specific InviteSearchController
     */
    @ReactMethod
    public void inviteFailedForItems(ReadableArray items, String inviteSearchControllerScope) {
        InviteSearchController controller = searchControllers.get(inviteSearchControllerScope);

        if(controller == null) {
            Log.w("InviteSearchModule", "Invite failed, but unable to find active controller to notify");
            return;
        }

        ArrayList<Map<String, Object>> jvmItems = new ArrayList<>();
        for(int i=0; i<items.size(); i++) {
            ReadableMap item = items.getMap(i);
            jvmItems.add(item.toHashMap());
        }

        controller.getSearchControllerDelegate().inviteFailed(controller, jvmItems);
    }

    @ReactMethod
    public void inviteSucceeded(String inviteSearchControllerScope) {
        InviteSearchController controller = searchControllers.get(inviteSearchControllerScope);

        if(controller == null) {
            Log.w("InviteSearchModule", "Invite succeeded, but unable to find active controller to notify");
            return;
        }

        controller.getSearchControllerDelegate().inviteSucceeded(controller);
        searchControllers.remove(inviteSearchControllerScope);
    }

    void removeSearchController(String inviteSearchControllerUuid) {
        searchControllers.remove(inviteSearchControllerUuid);
    }

    @Override
    public String getName() {
        return "InviteSearch";
    }

    private InviteSearchController createSearchController() {
        InviteSearchController searchController = new InviteSearchController(this);
        searchControllers.put(searchController.getUuid(), searchController);
        return searchController;
    }
}