package org.jitsi.meet.sdk;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.widget.FrameLayout;

import com.facebook.react.ReactRootView;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.WeakHashMap;

public class IncomingCallView extends FrameLayout {

    private static final int BACKGROUND_COLOR = 0xFF111111;

    private static final Set<IncomingCallView> views
        = Collections.newSetFromMap(new WeakHashMap<IncomingCallView, Boolean>());

    public static IncomingCallView findViewByExternalAPIScope(
        String externalAPIScope) {
        synchronized (views) {
            for (IncomingCallView view : views) {
                if (view.externalAPIScope.equals(externalAPIScope)) {
                    return view;
                }
            }
        }
        return null;
    }

    public static final class IncomingCallInfo {
        private final String callerName;
        private final String callerAvatarUrl;

        public IncomingCallInfo(@NonNull String callerName, @NonNull String callerAvatarUrl) {
            this.callerName = callerName;
            this.callerAvatarUrl = callerAvatarUrl;
        }

        public String getCallerName() {
            return callerName;
        }

        public String getCallerAvatarUrl() {
            return callerAvatarUrl;
        }
    }

    private final String externalAPIScope;
    private IncomingCallViewListener listener;
    private ReactRootView reactRootView;

    public IncomingCallView(@NonNull Context context) {
        super(context);

        if (ReactInstanceManagerHolder.getReactInstanceManager() == null) {
            ReactInstanceManagerHolder.initReactInstanceManager(((Activity) context).getApplication());
        }
        setBackgroundColor(BACKGROUND_COLOR);
        externalAPIScope = UUID.randomUUID().toString();
        synchronized (views) {
            views.add(this);
        }
    }

    public void dispose() {
        if (reactRootView != null) {
            removeView(reactRootView);
            reactRootView.unmountReactApplication();
            reactRootView = null;
        }
    }

    public IncomingCallViewListener getListener() {
        return listener;
    }

    public void setListener(IncomingCallViewListener listener) {
        this.listener = listener;
    }

    public void loadIncomingCallInfo(IncomingCallInfo callInfo) {
        Bundle props = new Bundle();

        props.putString("externalAPIScope", externalAPIScope);
        props.putString("url", "");
        props.putString("callerName", callInfo.getCallerName());
        props.putString("callerAvatarUrl", callInfo.getCallerAvatarUrl());
        if (reactRootView == null) {
            reactRootView = new ReactRootView(getContext());
            reactRootView.startReactApplication(
                ReactInstanceManagerHolder.getReactInstanceManager(),
                "IncomingCallApp",
                props);
            reactRootView.setBackgroundColor(BACKGROUND_COLOR);
            addView(reactRootView);
        } else {
            reactRootView.setAppProperties(props);
        }
    }
}
