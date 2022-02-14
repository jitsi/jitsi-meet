package org.jitsi.meet.sdk;

import android.app.Application;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;

import java.util.List;

/**
 * This is the minimal implementation of ReactNativeHost that will make things like the
 * Detox testing framework believe we are a "greenfield" app.
 *
 * Generally speaking, apps using the SDK (other than the Jitsi Meet app itself) should not
 * need to use this because the
 */
public class JitsiReactNativeHost extends ReactNativeHost {
    public JitsiReactNativeHost(Application application) {
        super(application);
    }

    @Override
    public boolean getUseDeveloperSupport() {
        // Unused since we override `createReactInstanceManager`.
        return false;
    }

    @Override
    protected List<ReactPackage> getPackages() {
        // Unused since we override `createReactInstanceManager`.
        return null;
    }

    @Override
    protected ReactInstanceManager createReactInstanceManager() {
        ReactInstanceManagerHolder.initReactInstanceManager(this.getApplication());

        return ReactInstanceManagerHolder.getReactInstanceManager();
    }
}
