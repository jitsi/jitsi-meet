package org.jitsi.meet.sdk;

import java.util.Map;

public interface IncomingCallViewListener {
    void onIncomingCallAnswered(Map<String, Object> data);

    void onIncomingCallDeclined(Map<String, Object> data);
}
