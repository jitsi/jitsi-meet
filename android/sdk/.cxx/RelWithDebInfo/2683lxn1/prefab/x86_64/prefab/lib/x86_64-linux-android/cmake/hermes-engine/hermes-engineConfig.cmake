if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/cchitu/.gradle/caches/8.14/transforms/20d6cf3df9ddfb6187d9c7e87c2ca417/transformed/jetified-hermes-android-0.16.0-release/prefab/modules/hermesvm/libs/android.x86_64/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cchitu/.gradle/caches/8.14/transforms/20d6cf3df9ddfb6187d9c7e87c2ca417/transformed/jetified-hermes-android-0.16.0-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

