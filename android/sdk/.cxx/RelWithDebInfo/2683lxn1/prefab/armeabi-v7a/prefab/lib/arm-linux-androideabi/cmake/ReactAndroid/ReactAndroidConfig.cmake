if(NOT TARGET ReactAndroid::hermestooling)
add_library(ReactAndroid::hermestooling SHARED IMPORTED)
set_target_properties(ReactAndroid::hermestooling PROPERTIES
    IMPORTED_LOCATION "/Users/cchitu/.gradle/caches/8.14/transforms/24e404e044d1c0f334f53ad90842bf6e/transformed/jetified-react-android-0.85.2-release/prefab/modules/hermestooling/libs/android.armeabi-v7a/libhermestooling.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cchitu/.gradle/caches/8.14/transforms/24e404e044d1c0f334f53ad90842bf6e/transformed/jetified-react-android-0.85.2-release/prefab/modules/hermestooling/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::jsi)
add_library(ReactAndroid::jsi SHARED IMPORTED)
set_target_properties(ReactAndroid::jsi PROPERTIES
    IMPORTED_LOCATION "/Users/cchitu/.gradle/caches/8.14/transforms/24e404e044d1c0f334f53ad90842bf6e/transformed/jetified-react-android-0.85.2-release/prefab/modules/jsi/libs/android.armeabi-v7a/libjsi.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cchitu/.gradle/caches/8.14/transforms/24e404e044d1c0f334f53ad90842bf6e/transformed/jetified-react-android-0.85.2-release/prefab/modules/jsi/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::reactnative)
add_library(ReactAndroid::reactnative SHARED IMPORTED)
set_target_properties(ReactAndroid::reactnative PROPERTIES
    IMPORTED_LOCATION "/Users/cchitu/.gradle/caches/8.14/transforms/24e404e044d1c0f334f53ad90842bf6e/transformed/jetified-react-android-0.85.2-release/prefab/modules/reactnative/libs/android.armeabi-v7a/libreactnative.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cchitu/.gradle/caches/8.14/transforms/24e404e044d1c0f334f53ad90842bf6e/transformed/jetified-react-android-0.85.2-release/prefab/modules/reactnative/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

