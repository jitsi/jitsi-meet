/*
 * Copyright @ 2019-present 8x8, Inc.
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

import com.facebook.react.bridge.ReadableMap;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;

class OngoingConferenceTracker {
    private static final Collection<OngoingConferenceListener> listeners =
        Collections.synchronizedSet(new HashSet<OngoingConferenceListener>());
    private static String currentConference;

    static synchronized String getCurrentConference() {
        return currentConference;
    }

    static synchronized void onExternalAPIEvent(String name, ReadableMap data) {
        if (!data.hasKey("url")) {
            return;
        }

        String url = data.getString("url");

        switch(name) {
            case "CONFERENCE_WILL_JOIN":
                currentConference = url;
                updateCurrentConference();
                break;

            case "CONFERENCE_TERMINATED":
                if (currentConference != null && url.equals(currentConference)) {
                    currentConference = null;
                    updateCurrentConference();
                }
                break;
        }
    }

    static void addListener(OngoingConferenceListener listener) {
        listeners.add(listener);
    }

    static void removeListener(OngoingConferenceListener listener) {
        listeners.remove(listener);
    }

    private static synchronized void updateCurrentConference() {
        for (OngoingConferenceListener listener: listeners) {
            listener.onCurrentConferenceChanged(currentConference);
        }
    }

    public interface OngoingConferenceListener {
        void onCurrentConferenceChanged(String conferenceUrl);
    }
}
