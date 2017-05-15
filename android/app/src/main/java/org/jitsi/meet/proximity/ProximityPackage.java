package org.jitsi.meet.proximity;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Implements {@link ReactPackage} for {@link ProximityModule}.
 */
public class ProximityPackage implements ReactPackage {
    /**
     * {@inheritDoc}
     */
    @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    /**
     * {@inheritDoc}
     *
     * @return List of native modules to be exposed by React Native.
     */
    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new ProximityModule(reactContext));

        return modules;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<ViewManager> createViewManagers(
            ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
