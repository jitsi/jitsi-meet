package org.jitsi.meet.sdk;

import java.util.ArrayList;
import java.util.List;

public class NotificationChannels {
    static final String ONGOING_CONFERENCE_CHANNEL_ID = "JitsiOngoingConferenceChannel";
    static final String ONGOING_CONFERNCE_CHANNEL_NAME = "Ongoing Conference Notifications";

    public static List<String> allIds = new ArrayList<String>() {{ add(ONGOING_CONFERENCE_CHANNEL_ID); }};
}
