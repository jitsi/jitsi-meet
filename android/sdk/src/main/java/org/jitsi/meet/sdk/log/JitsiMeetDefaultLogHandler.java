/*
 * Copyright @ 2019-present 8x8, Inc.
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

package org.jitsi.meet.sdk.log;

import android.util.Log;

import org.jetbrains.annotations.NotNull;

/**
 * Default implementation of a {@link JitsiMeetBaseLogHandler}. This is the main SDK logger, which
 * logs using the Android util.Log module.
 */
public class JitsiMeetDefaultLogHandler extends JitsiMeetBaseLogHandler {
    private static final String TAG = "JitsiMeetSDK";

    @Override
    protected void doLog(int priority, @NotNull String tag, @NotNull String msg) {
        Log.println(priority, tag, msg);
    }

    @Override
    protected String getDefaultTag() {
        return TAG;
    }
}
