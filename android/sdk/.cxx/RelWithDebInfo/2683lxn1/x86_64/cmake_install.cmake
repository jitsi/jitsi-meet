# Install script for directory: /Users/cchitu/Work/jitsi-meet/android/sdk/src/main/jni

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "/usr/local")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "RelWithDebInfo")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Install shared libraries without execute permission?
if(NOT DEFINED CMAKE_INSTALL_SO_NO_EXE)
  set(CMAKE_INSTALL_SO_NO_EXE "0")
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "TRUE")
endif()

# Set default install directory permissions.
if(NOT DEFINED CMAKE_OBJDUMP)
  set(CMAKE_OBJDUMP "/Users/cchitu/Library/Android/sdk/ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-objdump")
endif()

if(NOT CMAKE_INSTALL_LOCAL_ONLY)
  # Include the install script for each subdirectory.
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/GiphyReactNativeSDKSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/AmplitudeReactNative_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/rnasyncstorage_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/rnclipboard_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNCNetInfoSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNCSlider_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/ReactNativeKCKeepAwakeSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/rngesturehandler_codegen_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/pagerview_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNPerformanceSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/safeareacontext_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/rnscreens_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNSoundSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNSplashViewSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/rnsvg_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNCWebViewSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/RNWorkletsSpec_autolinked_build/cmake_install.cmake")
  include("/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/codegen_app_build/cmake_install.cmake")

endif()

if(CMAKE_INSTALL_COMPONENT)
  set(CMAKE_INSTALL_MANIFEST "install_manifest_${CMAKE_INSTALL_COMPONENT}.txt")
else()
  set(CMAKE_INSTALL_MANIFEST "install_manifest.txt")
endif()

string(REPLACE ";" "\n" CMAKE_INSTALL_MANIFEST_CONTENT
       "${CMAKE_INSTALL_MANIFEST_FILES}")
file(WRITE "/Users/cchitu/Work/jitsi-meet/android/sdk/.cxx/RelWithDebInfo/2683lxn1/x86_64/${CMAKE_INSTALL_MANIFEST}"
     "${CMAKE_INSTALL_MANIFEST_CONTENT}")
