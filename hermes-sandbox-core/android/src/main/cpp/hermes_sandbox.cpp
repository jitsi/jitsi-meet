#include <jni.h>
#include <string>

// Include the shared platform-agnostic core
#include <hermes_sandbox.h>

// Direct JNI functions that can be called from React Native
extern "C" {

// Create a new Hermes runtime
JNIEXPORT jlong JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_createRuntime(JNIEnv *env, jclass clazz) {
    try {
        return hermes_sandbox_create_runtime();
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return 0;
    }
}

// Evaluate JavaScript code
JNIEXPORT jstring JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_evaluateJavaScript(
    JNIEnv *env, jclass clazz, jlong runtimeId, jstring code) {
    
    try {
        // Convert Java string to C string
        const char* codeStr = env->GetStringUTFChars(code, nullptr);
        
        // Call platform-agnostic function
        const char* resultStr = hermes_sandbox_evaluate_javascript(runtimeId, codeStr);
        
        // Release Java string
        env->ReleaseStringUTFChars(code, codeStr);
        
        // Convert result back to Java string
        jstring result = env->NewStringUTF(resultStr);
        
        // Free the C string (allocated by strdup in the core)
        free((void*)resultStr);
        
        return result;
        
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return nullptr;
    }
}

// Delete a runtime
JNIEXPORT void JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_deleteRuntime(
    JNIEnv *env, jclass clazz, jlong runtimeId) {
    
    try {
        hermes_sandbox_delete_runtime(runtimeId);
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
    }
}

// Check if runtime exists
JNIEXPORT jboolean JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_hasRuntime(
    JNIEnv *env, jclass clazz, jlong runtimeId) {
    
    try {
        return hermes_sandbox_has_runtime(runtimeId) ? JNI_TRUE : JNI_FALSE;
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return JNI_FALSE;
    }
}

} // extern "C" 