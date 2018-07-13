/*
 * Copyright @ 2018-present Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jitsi.meet.sdk.incoming_call;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.widget.FrameLayout;

import com.facebook.react.ReactRootView;

import org.jitsi.meet.sdk.ReactInstanceManagerHolder;

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

    private final String externalAPIScope;
    private IncomingCallViewListener listener;
    private ReactRootView reactRootView;

    public IncomingCallView(@NonNull Context context) {
        super(context);

        ReactInstanceManagerHolder.initReactInstanceManager(((Activity) context).getApplication());

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
        props.putString("hasVideo", String.valueOf(callInfo.hasVideo()));
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
