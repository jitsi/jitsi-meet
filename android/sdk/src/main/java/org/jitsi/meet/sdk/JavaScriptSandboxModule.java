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

package org.jitsi.meet.sdk;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.squareup.duktape.Duktape;

@ReactModule(name = JavaScriptSandboxModule.NAME)
class JavaScriptSandboxModule extends ReactContextBaseJavaModule {
    public static final String NAME = "JavaScriptSandbox";

    public JavaScriptSandboxModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Evaluates the given code in a Duktape VM.
     * @param code - The code that needs to evaluated.
     * @param promise - Resolved with the output in case of success or rejected with an exception
     *                in case of failure.
     */
    @ReactMethod
    public void evaluate(String code, Promise promise) {
        Duktape vm = Duktape.create();
        try {
            Object res = vm.evaluate(code);
            promise.resolve(res.toString());
        } catch (Throwable tr) {
            promise.reject(tr);
        } finally {
            vm.close();
        }
    }

    @Override
    public String getName() {
        return NAME;
    }
}
