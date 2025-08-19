cmake_minimum_required(VERSION 3.18.1)

project(hermes_sandbox)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_library(log-lib log)

# Add compiler flags for Hermes
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1")

# Create the shared library
add_library(hermes_sandbox_core STATIC
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../hermes_sandbox_core.cpp)

# Include directories for React Native and Hermes headers
target_include_directories(hermes_sandbox_core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../  # Project root for hermes_sandbox.h
    ${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon
    ${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon/jsi
    ${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon/jsi/jsi
    ${CMAKE_CURRENT_SOURCE_DIR}/../../ios/Pods/hermes-engine/destroot/include
    )

# Export the library for use by Android
set_target_properties(hermes_sandbox_core PROPERTIES
    POSITION_INDEPENDENT_CODE ON
    )

# Create the Android-specific library (JavaNativeInterface wrapper)
add_library(hermes_sandbox SHARED
    ${CMAKE_CURRENT_SOURCE_DIR}/hermes_sandbox.cpp)

# Link against required libraries
target_link_libraries(hermes_sandbox
    ${log-lib}
    hermes_sandbox_core
    )

# Include directories for the Android library
target_include_directories(hermes_sandbox PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../../../../  # Project root for hermes_sandbox.h
    ${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon
    ${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon/jsi
    ${CMAKE_CURRENT_SOURCE_DIR}/../../node_modules/react-native/ReactCommon/jsi/jsi
    ${CMAKE_CURRENT_SOURCE_DIR}/../../ios/Pods/hermes-engine/destroot/include
    ) 