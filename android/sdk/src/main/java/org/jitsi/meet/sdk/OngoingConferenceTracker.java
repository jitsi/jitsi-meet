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


/**
 * Helper class to keep track of what the current conference is.
 */
class OngoingConferenceTracker {
    private static final OngoingConferenceTracker instance = new OngoingConferenceTracker();

    private static final String CONFERENCE_WILL_JOIN = "CONFERENCE_WILL_JOIN";
    private static final String CONFERENCE_TERMINATED = "CONFERENCE_TERMINATED";

    private final Collection<OngoingConferenceListener> listeners =
        Collections.synchronizedSet(new HashSet<OngoingConferenceListener>());
    private String currentConference;

    public OngoingConferenceTracker() {
    }

    public static OngoingConferenceTracker getInstance() {
        return instance;
    }

    /**
     * Gets the current active conference URL.
     *
     * @return - The current conference URL as a String.
     */
    synchronized String getCurrentConference() {
        return currentConference;
    }

    synchronized void onExternalAPIEvent(String name, ReadableMap data) {
        if (!data.hasKey("url")) {
            return;
        }

        String url = data.getString("url");
        if (url == null) {
            return;
        }

        switch(name) {
            case CONFERENCE_WILL_JOIN:
                currentConference = url;
                updateListeners();
                break;

            case CONFERENCE_TERMINATED:
                if (url.equals(currentConference)) {
                    currentConference = null;
                    updateListeners();
                }
                break;
        }
    }

    void addListener(OngoingConferenceListener listener) {
        listeners.add(listener);
    }

    void removeListener(OngoingConferenceListener listener) {
        listeners.remove(listener);
    }

    private void updateListeners() {
        synchronized (listeners) {
            for (OngoingConferenceListener listener : listeners) {
                listener.onCurrentConferenceChanged(currentConference);
            }
        }
    }

    public interface OngoingConferenceListener {
        void onCurrentConferenceChanged(String conferenceUrl);
    }
}
