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

import android.content.Context;
import android.os.Bundle;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReadableMap;

import org.jitsi.meet.sdk.BaseReactView;
import org.jitsi.meet.sdk.ListenerUtils;

import java.lang.reflect.Method;
import java.util.Map;

public class IncomingCallView
    extends BaseReactView<IncomingCallViewListener> {

    /**
     * The {@code Method}s of {@code JitsiMeetViewListener} by event name i.e.
     * redux action types.
     */
    private static final Map<String, Method> LISTENER_METHODS
        = ListenerUtils.mapListenerMethods(IncomingCallViewListener.class);

    public IncomingCallView(@NonNull Context context) {
        super(context);
    }

    /**
     * Handler for {@link ExternalAPIModule} events.
     *
     * @param name The name of the event.
     * @param data The details/specifics of the event to send determined
     * by/associated with the specified {@code name}.
     */
    @Override
    protected void onExternalAPIEvent(String name, ReadableMap data) {
        onExternalAPIEvent(LISTENER_METHODS, name, data);
    }

    /**
     * Sets the information for the incoming call this {@code IncomingCallView}
     * represents.
     *
     * @param callInfo - {@link IncomingCallInfo} object representing the caller
     * information.
     */
    public void setIncomingCallInfo(IncomingCallInfo callInfo) {
        Bundle props = new Bundle();

        props.putString("callerAvatarURL", callInfo.getCallerAvatarURL());
        props.putString("callerName", callInfo.getCallerName());
        props.putBoolean("hasVideo", callInfo.hasVideo());

        createReactRootView("IncomingCallApp", props);
    }
}
