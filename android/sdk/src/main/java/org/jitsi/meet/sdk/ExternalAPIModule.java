package org.jitsi.meet.sdk;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

/**
 * Module implementing a simple API to enable a proximity sensor-controlled
 * wake lock. When the lock is held, if the proximity sensor detects a nearby
 * object it will dim the screen and disable touch controls. The functionality
 * is used with the conference audio-only mode.
 */
class ExternalAPIModule extends AbstractExternalAPIModule<JitsiMeetViewListener> {
    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
     *
     * @param reactContext  the {@link ReactApplicationContext} where this module
     *                      is created.
     */
    public ExternalAPIModule(ReactApplicationContext reactContext) {
        super(reactContext, JitsiMeetViewListener.class);
    }

    /**
     * Gets the name of this module to be used in the React Native bridge.
     *
     * @return The name of this module to be used in the React Native bridge.
     */
    @Override
    public String getName() {
        return "ExternalAPI";
    }

    /**
     * The internal processing for the URL of the current conference set on the
     * associated {@link JitsiMeetView}.
     *
     * @param eventName the name of the external API event to be processed
     * @param eventData the details/specifics of the event to process determined
     * by/associated with the specified {@code eventName}.
     * @param view the {@link JitsiMeetView} instance.
     */
    private void maybeSetViewURL(
            String eventName,
            ReadableMap eventData,
            JitsiMeetView view) {
        switch(eventName) {
        case "CONFERENCE_WILL_JOIN":
            view.setURL(eventData.getString("url"));
            break;

        case "CONFERENCE_FAILED":
        case "CONFERENCE_WILL_LEAVE":
        case "LOAD_CONFIG_ERROR":
            String url = eventData.getString("url");

            if (url != null && url.equals(view.getURL())) {
                view.setURL(null);
            }
            break;
        }
    }

    @Override
    public JitsiMeetViewListener findListenerByExternalAPIScope(String scope) {
        // The JavaScript App needs to provide uniquely identifying information
        // to the native ExternalAPI module so that the latter may match the
        // former to the native JitsiMeetView which hosts it.
        JitsiMeetView view = JitsiMeetView.findViewByExternalAPIScope(scope);

        return view != null ? view.getListener() : null;
    }

    /**
     * Dispatches an event that occurred on the JavaScript side of the SDK to
     * the specified {@link JitsiMeetView}'s listener.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     * @param scope
     */
    @Override
    @ReactMethod
    public void sendEvent(String name, ReadableMap data, String scope) {
        JitsiMeetView view = JitsiMeetView.findViewByExternalAPIScope(scope);

        if (view != null) {
            maybeSetViewURL(name, data, view);
        }

        super.sendEvent(name, data, scope);
    }
}
