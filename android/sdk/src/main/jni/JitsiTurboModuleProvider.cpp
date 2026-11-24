// Restores `DefaultTurboModuleManagerDelegate::javaModuleProvider` so SDK
// consumers don't need to ship libappmodules.so themselves. 
// 
// All modules go through this provider — there is no
// Native Module path anymore. 
// 
// Delegates to:
//   - SdkSpec_ModuleProvider (this SDK's own TurboModules)
//   - FBReactNativeSpec_ModuleProvider (RN core)
//   - autolinking_ModuleProvider (every autolinked RN lib, list emitted by
//     the RN gradle plugin into autolinking.cpp at build time)

#include <DefaultTurboModuleManagerDelegate.h>
#include <FBReactNativeSpec.h>
#include <SdkSpec.h>
#include <autolinking.h>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <fbjni/fbjni.h>

namespace {

std::shared_ptr<facebook::react::TurboModule> jitsiJavaModuleProvider(
    const std::string& name,
    const facebook::react::JavaTurboModule::InitParams& params) {
  if (auto m = facebook::react::SdkSpec_ModuleProvider(name, params)) return m;
  if (auto m = facebook::react::FBReactNativeSpec_ModuleProvider(name, params)) return m;
  if (auto m = facebook::react::autolinking_ModuleProvider(name, params)) return m;
  return nullptr;
}

}  // namespace

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*reserved*/) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &jitsiJavaModuleProvider;
  });
}
