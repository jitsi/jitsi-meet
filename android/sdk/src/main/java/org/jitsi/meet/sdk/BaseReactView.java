package org.jitsi.meet.sdk;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import android.widget.FrameLayout;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.ReadableMap;
import com.rnimmersive.RNImmersiveModule;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.WeakHashMap;

/**
 * Base class for all views which are backed by a React Native view.
 */
public abstract class BaseReactView extends FrameLayout {
    /**
     * Background color used by {@code BaseReactView} and the React Native root
     * view.
     */
    protected static int BACKGROUND_COLOR = 0xFF111111;

    /**
     * The unique identifier of this {@code BaseReactView} within the process
     * for the purposes of {@link ExternalAPIModule}. The name scope was
     * inspired by postis which we use on Web for the similar purposes of the
     * iframe-based external API.
     */
    protected final String externalAPIScope;

    /**
     * React Native root view.
     */
    private ReactRootView reactRootView;

    /**
     * Collection with all created views. This is used for finding the right
     * view when delivering events coming from the {@link ExternalAPIModule};
     */
    static final Set<BaseReactView> views
        = Collections.newSetFromMap(new WeakHashMap<BaseReactView, Boolean>());

    /**
     * Find a view which matches the given external API scope.
     *
     * @param externalAPIScope - Scope for the view we want to find.
     * @return The found {@code BaseReactView}, or {@code null}.
     */
    public static BaseReactView findViewByExternalAPIScope(
            String externalAPIScope) {
        synchronized (views) {
            for (BaseReactView view : views) {
                if (view.externalAPIScope.equals(externalAPIScope)) {
                    return view;
                }
            }
        }

        return null;
    }

    public BaseReactView(@NonNull Context context) {
        super(context);

        setBackgroundColor(BACKGROUND_COLOR);

        ReactInstanceManagerHolder.initReactInstanceManager(
            ((Activity) context).getApplication());

        // Hook this BaseReactView into ExternalAPI.
        externalAPIScope = UUID.randomUUID().toString();
        synchronized (views) {
            views.add(this);
        }
    }

    /**
     * Creates the {@code ReactRootView} for the given app name with the given
     * props. Once created it's set as the view of this {@code FrameLayout}.
     *
     * @param appName - Name of the "app" (in React Native terms) which we want
     *                to load.
     * @param props - Props (in React terms) to be passed to the app.
     */
    public void createReactRootView(String appName, @Nullable Bundle props) {
        if (props == null) {
            props = new Bundle();
        }

        // Set externalAPIScope
        props.putString("externalAPIScope", externalAPIScope);

        if (reactRootView == null) {
            reactRootView = new ReactRootView(getContext());
            reactRootView.startReactApplication(
                ReactInstanceManagerHolder.getReactInstanceManager(),
                appName,
                props);
            reactRootView.setBackgroundColor(BACKGROUND_COLOR);
            addView(reactRootView);
        } else {
            reactRootView.setAppProperties(props);
        }
    }

    /**
     * Releases the React resources (specifically the {@link ReactRootView})
     * associated with this view.
     *
     * This method MUST be called when the Activity holding this view is
     * destroyed, typically in the {@code onDestroy} method.
     */
    public void dispose() {
        if (reactRootView != null) {
            removeView(reactRootView);
            reactRootView.unmountReactApplication();
            reactRootView = null;
        }
    }

    /**
     * Abstract method called by {@link ExternalAPIModule} when an event is
     * received for this view.
     *
     * @param name - Name of the event.
     * @param data - Event data.
     */
    public abstract void onExternalAPIEvent(String name, ReadableMap data);

    /**
     * Called when the window containing this view gains or loses focus.
     *
     * @param hasFocus If the window of this view now has focus, {@code true};
     * otherwise, {@code false}.
     */
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        // https://github.com/mockingbot/react-native-immersive#restore-immersive-state

        // FIXME The singleton pattern employed by RNImmersiveModule is not
        // advisable because a react-native mobule is consumable only after its
        // BaseJavaModule#initialize() has completed and here we have no
        // knowledge of whether the precondition is really met.
        RNImmersiveModule immersive = RNImmersiveModule.getInstance();

        if (hasFocus && immersive != null) {
            try {
                immersive.emitImmersiveStateChangeEvent();
            } catch (RuntimeException re) {
                // FIXME I don't know how to check myself whether
                // BaseJavaModule#initialize() has been invoked and thus
                // RNImmersiveModule is consumable. A safe workaround is to
                // swallow the failure because the whole full-screen/immersive
                // functionality is brittle anyway, akin to the icing on the
                // cake, and has been working without onWindowFocusChanged for a
                // very long time.
                Log.e("RNImmersiveModule",
                    "emitImmersiveStateChangeEvent() failed!", re);
            }
        }
    }
}
