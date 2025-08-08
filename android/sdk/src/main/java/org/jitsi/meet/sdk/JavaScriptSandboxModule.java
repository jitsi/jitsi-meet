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

@ReactModule(name = JavaScriptSandboxModule.NAME)
class JavaScriptSandboxModule extends ReactContextBaseJavaModule {
    public static final String NAME = "JavaScriptSandbox";

    // Load the Hermes sandbox native library
    static {
        System.loadLibrary("hermes_sandbox");
    }

    public JavaScriptSandboxModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Evaluates the given code in a Hermes runtime.
     * @param code - The code that needs to be evaluated.
     * @param promise - Resolved with the output in case of success or rejected with an exception
     *                in case of failure.
     */
    @ReactMethod
    public void evaluate(String code, Promise promise) {
        long runtimeId = 0;
        try {
            // Create an isolated Hermes runtime
            runtimeId = createRuntime();
            
            // Evaluate the JavaScript code
            String result = evaluateJavaScript(runtimeId, code);
            promise.resolve(result);
        } catch (Throwable tr) {
            promise.reject(tr);
        } finally {
            // Clean up the runtime
            if (runtimeId != 0) {
                deleteRuntime(runtimeId);
            }
        }
    }

    @Override
    public String getName() {
        return NAME;
    }

    // Native methods for Hermes C API
    private native long createRuntime();
    private native String evaluateJavaScript(long runtimeId, String code);
    private native void deleteRuntime(long runtimeId);
}
