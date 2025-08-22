cmake_minimum_required(VERSION 3.18.1)

project(hermes_sandbox)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add 16KB page size compatibility flags
if(ANDROID)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON")
    
    # Add proper alignment flags for 16KB page size
    # Use the correct Android NDK linker flags
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,relro -Wl,-z,now")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,-z,relro -Wl,-z,now")
    
    # Set page size alignment for shared libraries - use the correct flag
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,common-page-size=0x4000")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=0x4000")
endif()

# Find required packages
find_library(log-lib log)

# Add compiler flags for React Native
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1")

# Create the shared library
add_library(hermes_sandbox_core STATIC
    ../../../../hermes_sandbox_core.cpp)

# Include directories for React Native and JSI headers
target_include_directories(hermes_sandbox_core PUBLIC
    .
    ../../../../  # Project root for hermes_sandbox.h
    ../../../../../node_modules/react-native/ReactCommon/jsi
    ../../../../../node_modules/react-native/ReactCommon/jsi/jsi
    )

# Link libraries
target_link_libraries(hermes_sandbox_core ${log-lib})

# Create the shared library
add_library(hermes_sandbox SHARED
    hermes_sandbox.cpp)

# Include directories
target_include_directories(hermes_sandbox PUBLIC
    .
    ../../../../  # Project root for hermes_sandbox.h
    )

# Link libraries
target_link_libraries(hermes_sandbox hermes_sandbox_core ${log-lib})

# Set specific alignment properties for the shared library
set_target_properties(hermes_sandbox PROPERTIES
    POSITION_INDEPENDENT_CODE ON
    ) 