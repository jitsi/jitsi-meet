package org.jitsi.meet;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

public class MainActivity extends ReactActivity {
    /**
     * {@inheritDoc}
     *
     * Overrides {@link ReactActivity#createRootActivityDelegate()} to customize
     * the {@link ReactRootView} with a background color that is in accord with
     * the JavaScript and iOS parts of the application and causes less perceived
     * visual flicker than the default background color.
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            /**
             * {@inheritDoc}
             *
             * Overrides {@link ReactActivityDelegate#createRootView()} to
             * customize the {@link ReactRootView} with a background color that
             * is in accord with the JavaScript and iOS parts of the application
             * and causes less perceived visual flicker than the default
             * background color.
             */
            @Override
            protected ReactRootView createRootView() {
                ReactRootView rootView = super.createRootView();

                rootView.setBackgroundColor(0xFF111111);
                return rootView;
            }
        };
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "App";
    }
}
