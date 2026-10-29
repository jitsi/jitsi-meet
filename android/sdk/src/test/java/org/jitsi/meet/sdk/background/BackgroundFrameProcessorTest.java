package org.jitsi.meet.sdk.background;

import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class BackgroundFrameProcessorTest {
    @Test
    public void invalidationRejectsOldRequestUntilItFinishes() {
        BackgroundFrameProcessor.RequestTracker requests = new BackgroundFrameProcessor.RequestTracker();
        long oldRequest = requests.begin();

        assertTrue(requests.isCurrent(oldRequest));
        requests.invalidate();
        assertFalse(requests.isCurrent(oldRequest));
        assertTrue(requests.isInFlight());

        requests.complete(oldRequest);
        assertFalse(requests.isInFlight());
        long newRequest = requests.begin();
        assertTrue(requests.isCurrent(newRequest));
        assertFalse(requests.isCurrent(oldRequest));
        requests.complete(oldRequest);
        assertTrue(requests.isInFlight());
        requests.complete(newRequest);
        assertFalse(requests.isInFlight());
    }
}
