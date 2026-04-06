if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/cchitu/.gradle/caches/8.14/transforms/98725684a4c3edee512ba727b56f26a8/transformed/jetified-hermes-android-0.16.0-debug/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cchitu/.gradle/caches/8.14/transforms/98725684a4c3edee512ba727b56f26a8/transformed/jetified-hermes-android-0.16.0-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

