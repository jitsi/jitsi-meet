package org.jitsi.meet.sdk;

import com.facebook.react.bridge.ReactApplicationContext;

class IncomingCallExternalAPIModule extends AbstractExternalAPIModule<IncomingCallViewListener> {

    /**
     * Initializes a new module instance. There shall be a single instance of
     * this module throughout the lifetime of the application.
     *
     * @param reactContext  the {@link ReactApplicationContext} where this module
     *                      is created.
     */
    public IncomingCallExternalAPIModule(ReactApplicationContext reactContext) {
        super(reactContext, IncomingCallViewListener.class);
    }

    /**
     * Gets the name of this module to be used in the React Native bridge.
     *
     * @return The name of this module to be used in the React Native bridge.
     */
    @Override
    public String getName() {
        return "IncomingCallExternalAPI";
    }

    @Override
    public IncomingCallViewListener findListenerByExternalAPIScope(String scope) {
        IncomingCallView view = IncomingCallView.findViewByExternalAPIScope(scope);

        return view != null ? view.getListener() : null;
    }
}
