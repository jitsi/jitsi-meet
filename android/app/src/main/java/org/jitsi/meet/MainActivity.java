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

package org.jitsi.meet;

import android.os.Bundle;
import android.util.Log;

import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.JitsiMeetViewListener;
import org.jitsi.meet.sdk.invite.AddPeopleController;
import org.jitsi.meet.sdk.invite.AddPeopleControllerListener;
import org.jitsi.meet.sdk.invite.InviteController;
import org.jitsi.meet.sdk.invite.InviteControllerListener;

import com.facebook.react.bridge.UiThreadUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The one and only {@link Activity} that the Jitsi Meet app needs. The
 * {@code Activity} is launched in {@code singleTask} mode, so it will be
 * created upon application initialization and there will be a single instance
 * of it. Further attempts at launching the application once it was already
 * launched will result in {@link Activity#onNewIntent(Intent)} being called.
 *
 * This {@code Activity} extends {@link JitsiMeetActivity} to keep the React
 * Native CLI working, since the latter always tries to launch an
 * {@code Activity} named {@code MainActivity} when doing
 * {@code react-native run-android}.
 */
public class MainActivity extends JitsiMeetActivity {
    /**
     * The query to perform through {@link AddPeopleController} when the
     * {@code InviteButton} is tapped in order to exercise the public API of the
     * feature invite. If {@code null}, the {@code InviteButton} will not be
     * rendered.
     */
    private static final String ADD_PEOPLE_CONTROLLER_QUERY = null;

    @Override
    protected JitsiMeetView initializeView() {
        JitsiMeetView view = super.initializeView();

        // XXX In order to increase (1) awareness of API breakages and (2) API
        // coverage, utilize JitsiMeetViewListener in the Debug configuration of
        // the app.
        if (BuildConfig.DEBUG && view != null) {
            view.setListener(new JitsiMeetViewListener() {
                private void on(String name, Map<String, Object> data) {
                    UiThreadUtil.assertOnUiThread();

                    // Log with the tag "ReactNative" in order to have the log
                    // visible in react-native log-android as well.
                    Log.d(
                        "ReactNative",
                        JitsiMeetViewListener.class.getSimpleName() + " "
                            + name + " "
                            + data);
                }

                @Override
                public void onConferenceFailed(Map<String, Object> data) {
                    on("CONFERENCE_FAILED", data);
                }

                @Override
                public void onConferenceJoined(Map<String, Object> data) {
                    on("CONFERENCE_JOINED", data);
                }

                @Override
                public void onConferenceLeft(Map<String, Object> data) {
                    on("CONFERENCE_LEFT", data);
                }

                @Override
                public void onConferenceWillJoin(Map<String, Object> data) {
                    on("CONFERENCE_WILL_JOIN", data);
                }

                @Override
                public void onConferenceWillLeave(Map<String, Object> data) {
                    on("CONFERENCE_WILL_LEAVE", data);
                }

                @Override
                public void onLoadConfigError(Map<String, Object> data) {
                    on("LOAD_CONFIG_ERROR", data);
                }
            });

            // inviteController
            final InviteController inviteController
                = view.getInviteController();

            inviteController.setListener(new InviteControllerListener() {
                public void beginAddPeople(
                        AddPeopleController addPeopleController) {
                    onInviteControllerBeginAddPeople(
                        inviteController,
                        addPeopleController);
                }
            });
            inviteController.setAddPeopleEnabled(
                ADD_PEOPLE_CONTROLLER_QUERY != null);
            inviteController.setDialOutEnabled(
                inviteController.isAddPeopleEnabled());
        }

        return view;
    }

    private void onAddPeopleControllerInviteSettled(
            AddPeopleController addPeopleController,
            List<Map<String, Object>> failedInvitees) {
        UiThreadUtil.assertOnUiThread();

        // XXX Explicitly invoke endAddPeople on addPeopleController; otherwise,
        // it is going to be memory-leaked in the associated InviteController
        // and no subsequent InviteButton clicks/taps will be delivered.
        // Technically, endAddPeople will automatically be invoked if there are
        // no failedInviteees i.e. the invite succeeeded for all specified
        // invitees.
        addPeopleController.endAddPeople();
    }

    private void onAddPeopleControllerReceivedResults(
            AddPeopleController addPeopleController,
            List<Map<String, Object>> results,
            String query) {
        UiThreadUtil.assertOnUiThread();

        int size = results.size();

        if (size > 0) {
            // Exercise AddPeopleController's inviteById implementation.
            List<String> ids = new ArrayList<>(size);

            for (Map<String, Object> result : results) {
                Object id = result.get("id");

                if (id != null) {
                    ids.add(id.toString());
                }
            }

            addPeopleController.inviteById(ids);

            return;
        }

        // XXX Explicitly invoke endAddPeople on addPeopleController; otherwise,
        // it is going to be memory-leaked in the associated InviteController
        // and no subsequent InviteButton clicks/taps will be delivered.
        addPeopleController.endAddPeople();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // As this is the Jitsi Meet app (i.e. not the Jitsi Meet SDK), we do
        // want to enable some options.

        // The welcome page defaults to disabled in the SDK at the time of this
        // writing but it is clearer to be explicit about what we want anyway.
        setWelcomePageEnabled(true);

        super.onCreate(savedInstanceState);
    }

    private void onInviteControllerBeginAddPeople(
            InviteController inviteController,
            AddPeopleController addPeopleController) {
        UiThreadUtil.assertOnUiThread();

        // Log with the tag "ReactNative" in order to have the log visible in
        // react-native log-android as well.
        Log.d(
            "ReactNative",
            InviteControllerListener.class.getSimpleName() + ".beginAddPeople");

        String query = ADD_PEOPLE_CONTROLLER_QUERY;
    
        if (query != null
                && (inviteController.isAddPeopleEnabled()
                    || inviteController.isDialOutEnabled())) {
            addPeopleController.setListener(new AddPeopleControllerListener() {
                public void onInviteSettled(
                        AddPeopleController addPeopleController,
                        List<Map<String, Object>> failedInvitees) {
                    onAddPeopleControllerInviteSettled(
                        addPeopleController,
                        failedInvitees);
                }

                public void onReceivedResults(
                        AddPeopleController addPeopleController,
                        List<Map<String, Object>> results,
                        String query) {
                    onAddPeopleControllerReceivedResults(
                        addPeopleController,
                        results, query);
                }
            });
            addPeopleController.performQuery(query);
        } else {
            // XXX Explicitly invoke endAddPeople on addPeopleController;
            // otherwise, it is going to be memory-leaked in the associated
            // InviteController and no subsequent InviteButton clicks/taps will
            // be delivered.
            addPeopleController.endAddPeople();
        }
    }
}
