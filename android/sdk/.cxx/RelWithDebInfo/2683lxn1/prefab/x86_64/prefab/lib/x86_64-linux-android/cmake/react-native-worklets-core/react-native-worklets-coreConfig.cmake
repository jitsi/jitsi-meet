if(NOT TARGET react-native-worklets-core::rnworklets)
add_library(react-native-worklets-core::rnworklets SHARED IMPORTED)
set_target_properties(react-native-worklets-core::rnworklets PROPERTIES
    IMPORTED_LOCATION "/Users/cchitu/Work/jitsi-meet/node_modules/react-native-worklets-core/android/build/intermediates/cxx/RelWithDebInfo/34b3o4s4/obj/x86_64/librnworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cchitu/Work/jitsi-meet/node_modules/react-native-worklets-core/android/build/headers/rnworklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

