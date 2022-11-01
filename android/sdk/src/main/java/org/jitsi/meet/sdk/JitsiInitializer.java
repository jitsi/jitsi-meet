/*
 * Copyright @ 2021-present 8x8, Inc.
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
package org.jitsi.meet.sdk;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.startup.Initializer;

import com.facebook.soloader.SoLoader;
import org.wonday.orientation.OrientationActivityLifecycle;

import java.util.Collections;
import java.util.List;

public class JitsiInitializer implements Initializer<Boolean> {

    @NonNull
    @Override
    public Boolean create(@NonNull Context context) {
        Log.d(this.getClass().getCanonicalName(), "create");

        SoLoader.init(context, /* native exopackage */ false);

        // Register our uncaught exception handler.
        JitsiMeetUncaughtExceptionHandler.register();

        // Register activity lifecycle handler for the orientation locker module.
        ((Application) context).registerActivityLifecycleCallbacks(OrientationActivityLifecycle.getInstance());

        return true;
    }

    @NonNull
    @Override
    public List<Class<? extends Initializer<?>>> dependencies() {
        return Collections.emptyList();
    }
}