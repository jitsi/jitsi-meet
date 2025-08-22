#include <jni.h>
#include <string>

// Include the shared platform-agnostic core
#include <hermes_sandbox.h>

// Direct JNI functions that can be called from React Native
extern "C" {

// Create a new Hermes runtime
JNIEXPORT jlong JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_createRuntime(JNIEnv *env, jclass clazz, jstring name) {
    try {
        const char* nameStr = name ? env->GetStringUTFChars(name, nullptr) : nullptr;
        jlong result = hermes_sandbox_create_runtime(nameStr);
        
        if (name) {
            env->ReleaseStringUTFChars(name, nameStr);
        }
        
        return result;
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return 0;
    }
}

// Evaluate JavaScript code
JNIEXPORT jstring JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_evaluateJavaScript(
    JNIEnv *env, jclass clazz, jlong runtimeId, jstring code, jstring sourceURL) {
    
    try {
        // Convert Java strings to C strings
        const char* codeStr = env->GetStringUTFChars(code, nullptr);
        const char* sourceURLStr = sourceURL ? env->GetStringUTFChars(sourceURL, nullptr) : nullptr;
        
        // Call platform-agnostic function
        const char* resultStr = hermes_sandbox_evaluate_javascript(runtimeId, codeStr, sourceURLStr);
        
        // Release Java strings
        env->ReleaseStringUTFChars(code, codeStr);
        if (sourceURL) {
            env->ReleaseStringUTFChars(sourceURL, sourceURLStr);
        }
        
        // Convert result back to Java string
        jstring result = env->NewStringUTF(resultStr);
        
        return result;
        
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return nullptr;
    }
}

// Delete a runtime
JNIEXPORT jboolean JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_deleteRuntime(
    JNIEnv *env, jclass clazz, jlong runtimeId) {
    
    try {
        return hermes_sandbox_delete_runtime(runtimeId) ? JNI_TRUE : JNI_FALSE;
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return JNI_FALSE;
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

// Get runtime name
JNIEXPORT jstring JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_getRuntimeName(
    JNIEnv *env, jclass clazz, jlong runtimeId) {
    
    try {
        const char* nameStr = hermes_sandbox_get_runtime_name(runtimeId);
        if (nameStr) {
            return env->NewStringUTF(nameStr);
        }
        return nullptr;
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return nullptr;
    }
}

// Get runtime count
JNIEXPORT jint JNICALL
Java_org_jitsi_meet_sdk_JavaScriptSandboxModule_getRuntimeCount(
    JNIEnv *env, jclass clazz) {
    
    try {
        return hermes_sandbox_get_runtime_count();
    } catch (const std::exception& e) {
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), e.what());
        return 0;
    }
}

} // extern "C" 