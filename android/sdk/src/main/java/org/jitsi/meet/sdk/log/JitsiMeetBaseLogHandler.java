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
import org.jetbrains.annotations.Nullable;

import java.text.MessageFormat;

import timber.log.Timber;

/**
 * Base class for all custom log handlers. Implementations must inherit from this class and
 * implement a `doLog` method which does the actual logging, in addition with a `getTag` method
 * with which to tag all logs coming into this logger.
 *
 * See {@link JitsiMeetDefaultLogHandler} for an example.
 */
public abstract class JitsiMeetBaseLogHandler extends Timber.Tree {
    @Override
    protected void log(int priority, @Nullable String tag, @NotNull String msg, @Nullable Throwable t) {
        String errmsg = Log.getStackTraceString(t);
        if (errmsg.isEmpty()) {
            doLog(priority, getDefaultTag(), msg);
        } else {
            doLog(priority, getDefaultTag(), MessageFormat.format("{0}\n{1}", msg, errmsg));
        }
    }

    protected abstract void doLog(int priority, @NotNull String tag, @NotNull String msg);

    protected abstract String getDefaultTag();
}
