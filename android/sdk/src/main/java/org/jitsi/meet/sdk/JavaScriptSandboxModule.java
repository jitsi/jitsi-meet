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
import com.facebook.react.bridge.ReadableMap;
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
     * Creates a new isolated Hermes runtime.
     * @param name Optional name for the runtime
     * @param promise - Resolved with the runtime ID in case of success or rejected with an exception
     *                in case of failure.
     */
    @ReactMethod
    public void createRuntime(String name, Promise promise) {
        try {
            long runtimeId = createRuntime(name);
            if (runtimeId != 0) {
                promise.resolve(runtimeId);
            } else {
                promise.reject("CREATE_RUNTIME_ERROR", "Failed to create runtime");
            }
        } catch (Throwable tr) {
            promise.reject(tr);
        }
    }

    /**
     * Evaluates the given code in a specific Hermes runtime.
     * @param runtimeId - The runtime ID to evaluate in
     * @param code - The code that needs to be evaluated.
     * @param sourceURL - Optional source URL for debugging
     * @param promise - Resolved with the output in case of success or rejected with an exception
     *                in case of failure.
     */
    @ReactMethod
    public void evaluateInRuntime(long runtimeId, String code, String sourceURL, Promise promise) {
        try {
            if (!hasRuntime(runtimeId)) {
                promise.reject("INVALID_RUNTIME", "Runtime does not exist: " + runtimeId);
                return;
            }
            
            String result = evaluateJavaScript(runtimeId, code, sourceURL);
            promise.resolve(result);
        } catch (Throwable tr) {
            promise.reject(tr);
        }
    }

    /**
     * Evaluates the given code in a temporary Hermes runtime (creates and destroys).
     * @param code - The code that needs to be evaluated.
     * @param promise - Resolved with the output in case of success or rejected with an exception
     *                in case of failure.
     */
    @ReactMethod
    public void evaluate(String code, Promise promise) {
        long runtimeId = 0;
        try {
            // Create an isolated Hermes runtime
            runtimeId = createRuntime("temp_runtime");
            if (runtimeId == 0) {
                promise.reject("CREATE_RUNTIME_ERROR", "Failed to create temporary runtime");
                return;
            }
            
            // Evaluate the JavaScript code
            String result = evaluateJavaScript(runtimeId, code, "temp_evaluation");
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

    /**
     * Deletes a specific runtime.
     * @param runtimeId - The runtime ID to delete
     * @param promise - Resolved with success status or rejected with an exception
     */
    @ReactMethod
    public void deleteRuntime(long runtimeId, Promise promise) {
        try {
            boolean success = deleteRuntime(runtimeId);
            promise.resolve(success);
        } catch (Throwable tr) {
            promise.reject(tr);
        }
    }

    /**
     * Checks if a runtime exists.
     * @param runtimeId - The runtime ID to check
     * @param promise - Resolved with existence status or rejected with an exception
     */
    @ReactMethod
    public void hasRuntime(long runtimeId, Promise promise) {
        try {
            boolean exists = hasRuntime(runtimeId);
            promise.resolve(exists);
        } catch (Throwable tr) {
            promise.reject(tr);
        }
    }

    /**
     * Gets the name of a runtime.
     * @param runtimeId - The runtime ID
     * @param promise - Resolved with the runtime name or rejected with an exception
     */
    @ReactMethod
    public void getRuntimeName(long runtimeId, Promise promise) {
        try {
            String name = getRuntimeName(runtimeId);
            promise.resolve(name);
        } catch (Throwable tr) {
            promise.reject(tr);
        }
    }

    /**
     * Gets the total number of active runtimes.
     * @param promise - Resolved with the runtime count or rejected with an exception
     */
    @ReactMethod
    public void getRuntimeCount(Promise promise) {
        try {
            int count = getRuntimeCount();
            promise.resolve(count);
        } catch (Throwable tr) {
            promise.reject(tr);
        }
    }

    @Override
    public String getName() {
        return NAME;
    }

    // Native methods for Hermes C API
    private native long createRuntime(String name);
    private native String evaluateJavaScript(long runtimeId, String code, String sourceURL);
    private native boolean deleteRuntime(long runtimeId);
    private native boolean hasRuntime(long runtimeId);
    private native String getRuntimeName(long runtimeId);
    private native int getRuntimeCount();
}
