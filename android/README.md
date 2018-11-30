# Jitsi Meet SDK for Android

## Build your own, or use a pre-build SDK artifacts/binaries
Jitsi conveniently provides a pre-build SDK artifacts/binaries in its Maven repository. When you do not require any modification to the SDK itself, it's suggested to use the pre-build SDK. This avoids the complexity of building and installing your own SDK artifacts/binaries.

### Use pre-build SDK artifacts/binaries
In your project, add the Maven repository
`https://github.com/jitsi/jitsi-maven-repository/raw/master/releases` and the
dependency `org.jitsi.react:jitsi-meet-sdk` into your `build.gradle` files.

The repository typically goes into the `build.gradle` file in the root of your project:

```gradle
allprojects {
    repositories {
        google()
        jcenter()
        maven {
            url "https://github.com/jitsi/jitsi-maven-repository/raw/master/releases"
        }
    }
}
```

Dependency definitions belong in the individual module `build.gradle` files:

```gradle
dependencies {
    // (other dependencies)
    implementation ('org.jitsi.react:jitsi-meet-sdk:+') { transitive = true }
}
```

### Build and use your own SDK artifacts/binaries

Start by making sure that your development environment [is set up correctly](https://github.com/jitsi/jitsi-meet/blob/master/doc/mobile.md).

A note on dependencies: Apart from the SDK, Jitsi also publishes a binary Maven artifact for some of the SDK dependencies (that are not otherwise publicly available) to the Jitsi Maven repository. When you're planning to use a SDK that is built from source, you'll likely use a version of the source code that is newer (or at least _different_) than the version of the source that was used to create the binary SDK artifact. As a consequence, the dependencies that your project will need, might also be different from those that are published in the Jitsi Maven repository. This might lead to build problems, caused by dependencies that are unavailable.

If you want to use a SDK that is built from source, you will likely benefit from composing a local Maven repository that contains these dependencies. The text below describes how you create a repository that includes both the SDK as well as these dependencies. For illustration purposes, we'll define the location of this local Maven repository as `/tmp/repo`

In source code form, the Android SDK dependencies are locked/pinned by package.json and package-lock.json of the Jitsi Meet project. To obtain the data, execute NPM in the parent directory:

    $ (cd ..; npm install)

This will pull in the dependencies in either binary format, or in source code format, somewhere under /node_modules/

At the time of writing, the React Native dependency is the only one pulled in in binary format. To copy it to your local Maven repository, you can simply copy part of the directory structure that was pulled in by NPM:

    $ cp -r ../node_modules/react-native/android/com /tmp/repo/

In the same way, copy the JavaScriptCore dependency:

    $ cp -r ../node_modules/jsc-android/dist/org /tmp/repo/

Third-party React Native _modules_, which Jitsi Meet SDK for Android depends on, are download by NPM in source code form. These need to be assembled into Maven artifacts, and then published to your local Maven repository. The SDK project facilitates this. 

To prepare, Configure the Maven repositories in which you are going to publish the SDK artifacts/binaries. In `android/sdk/build.gradle` as well as in `android/build.gradle` modify the lines that contain:

    "file:${rootProject.projectDir}/../../../jitsi/jitsi-maven-repository/releases"

Change this value (which represents the Maven repository location used internally by the Jitsi Developers) to the location of the repository that you'd like to use:

    "file:/tmp/repo"

Make sure to do this in both files! Each file should require one line to be changed.

To create the release assembly for any _specific_ third-party React Native module that you need, you can execture the following commands, replace the module name in the examples below.

    $ ./gradlew :react-native-webrtc:assembleRelease 
    $ ./gradlew :react-native-webrtc:publish

You build and publish the SDK itself in the same way:

    $ ./gradlew :sdk:assembleRelease
    $ ./gradlew :sdk:publish

Alternatively, you can assemble and publish _all_ subprojects, which include the react-native modules, but also the SDK itself, with a single command:

    $ ./gradlew assembleRelease publish

You're now ready to use the artifacts. In _your_ project, add the Maven repository that you used above (`/tmp/repo`) into your top-level `build.gradle` file:

    allprojects {
        repositories {
            maven { url "file:/tmp/repo" }
            google()
            jcenter()
        }
    }

You can use your local repository to replace the Jitsi repository (`maven { url "https://github.com/jitsi/jitsi-maven-repository/raw/master/releases" }`) when you published _all_ subprojects. If you didn't do that, you'll have to add both repositories. Make sure your local repository is listed first!

Then, define the dependency `org.jitsi.react:jitsi-meet-sdk` into the `build.gradle` file of your module:

    implementation ('org.jitsi.react:jitsi-meet-sdk:+') { transitive = true }

Note that there should not be a need to explicitly add the other dependencies, as they will be pulled in as transitive dependencies of `jitsi-meet-sdk`.


## Using the API

Jitsi Meet SDK is an Android library which embodies the whole Jitsi Meet
experience and makes it reusable by third-party apps.

First, add Java 1.8 compatibility support to your project by adding the
following lines into your `build.gradle` file:

```
compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
}
```

To get started, extends your `android.app.Activity` from
`org.jitsi.meet.sdk.JitsiMeetActivity`:

```java
package org.jitsi.example;

import org.jitsi.meet.sdk.JitsiMeetActivity;

public class MainActivity extends JitsiMeetActivity {
}
```

Alternatively, you can use the `org.jitsi.meet.sdk.JitsiMeetView` class which
extends `android.view.View`:

```java
package org.jitsi.example;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;

import org.jitsi.meet.sdk.JitsiMeetView;

public class MainActivity extends AppCompatActivity {
    private JitsiMeetView view;

    @Override
    public void onBackPressed() {
        if (!JitsiMeetView.onBackPressed()) {
            // Invoke the default handler if it wasn't handled by React.
            super.onBackPressed();
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        view = new JitsiMeetView(this);
        view.loadURL(null);

        setContentView(view);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        view.dispose();
        view = null;

        JitsiMeetView.onHostDestroy(this);
    }

    @Override
    public void onNewIntent(Intent intent) {
        JitsiMeetView.onNewIntent(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();

        JitsiMeetView.onHostResume(this);
    }

    @Override
    protected void onStop() {
        super.onStop();

        JitsiMeetView.onHostPause(this);
    }
}
```

### JitsiMeetActivity

This class encapsulates a high level API in the form of an Android `Activity`
which displays a single `JitsiMeetView`.

#### getDefaultURL()

See JitsiMeetView.getDefaultURL.

#### isPictureInPictureEnabled()

See JitsiMeetView.isPictureInPictureEnabled.

#### isWelcomePageEnabled()

See JitsiMeetView.isWelcomePageEnabled.

#### loadURL(URL)

See JitsiMeetView.loadURL.

#### setDefaultURL(URL)

See JitsiMeetView.setDefaultURL.

#### setPictureInPictureEnabled(boolean)

See JitsiMeetView.setPictureInPictureEnabled.

#### setWelcomePageEnabled(boolean)

See JitsiMeetView.setWelcomePageEnabled.

### JitsiMeetView

The `JitsiMeetView` class is the core of Jitsi Meet SDK. It's designed to
display a Jitsi Meet conference (or a welcome page).

#### dispose()

Releases all resources associated with this view. This method MUST be called
when the Activity holding this view is going to be destroyed, usually in the
`onDestroy()` method.

#### getDefaultURL()

Returns the default base URL used to join a conference when a partial URL (e.g.
a room name only) is specified to `loadURLString`/`loadURLObject`. If not set or
if set to `null`, the default built in JavaScript is used: https://meet.jit.si.

#### getListener()

Returns the `JitsiMeetViewListener` instance attached to the view.

#### isPictureInPictureEnabled()

Returns `true` if Picture-in-Picture is enabled; `false`, otherwise. If not
explicitly set (by a preceding `setPictureInPictureEnabled` call), defaults to
`true` if the platform supports Picture-in-Picture natively; `false`, otherwise.

#### isWelcomePageEnabled()

Returns true if the Welcome page is enabled; otherwise, false. If false, a black
empty view will be rendered when not in a conference. Defaults to false.

#### loadURL(URL)

Loads a specific URL which may identify a conference to join. If the specified
URL is null and the Welcome page is enabled, the Welcome page is displayed
instead.

#### loadURLString(String)

Loads a specific URL which may identify a conference to join. If the specified
URL is null and the Welcome page is enabled, the Welcome page is displayed
instead.

#### loadURLObject(Bundle)

Loads a specific URL which may identify a conference to join. The URL is
specified in the form of a Bundle of properties which (1) internally are
sufficient to construct a URL (string) while (2) abstracting the specifics of
constructing the URL away from API clients/consumers. If the specified URL is
null and the Welcome page is enabled, the Welcome page is displayed instead.

Example:

```java
Bundle config = new Bundle();
config.putBoolean("startWithAudioMuted", true);
config.putBoolean("startWithVideoMuted", false);
Bundle urlObject = new Bundle();
urlObject.putBundle("config", config);
urlObject.putString("url", "https://meet.jit.si/Test123");
view.loadURLObject(urlObject);
```

#### setDefaultURL(URL)

Sets the default URL. See `getDefaultURL` for more information.

NOTE: Must be called before (if at all) `loadURL`/`loadURLString` for it to take
effect.

#### setListener(listener)

Sets the given listener (class implementing the `JitsiMeetViewListener`
interface) on the view.

#### setPictureInPictureEnabled(boolean)

Sets whether Picture-in-Picture is enabled. If not set, Jitsi Meet SDK
automatically enables/disables Picture-in-Picture based on native platform
support.

NOTE: Must be called (if at all) before `loadURL`/`loadURLString` for it to take
effect.

#### setWelcomePageEnabled(boolean)

Sets whether the Welcome page is enabled. See `isWelcomePageEnabled` for more
information.

NOTE: Must be called (if at all) before `loadURL`/`loadURLString` for it to take
effect.

#### onBackPressed()

Helper method which should be called from the activity's `onBackPressed` method.
If this function returns `true`, it means the action was handled and thus no
extra processing is required; otherwise the app should call the parent's
`onBackPressed` method.

This is a static method.

#### onHostDestroy(activity)

Helper method which should be called from the activity's `onDestroy` method.

This is a static method.

#### onHostPause(activity)

Helper method which should be called from the activity's `onPause` method.

This is a static method.

#### onHostResume(activity)

Helper method which should be called from the activity's `onResume` or `onStop`
method.

This is a static method.

#### onNewIntent(intent)

Helper method for integrating the *deep linking* functionality. If your app's
activity is launched in "singleTask" mode this method should be called from the
activity's `onNewIntent` method.

This is a static method.

#### onUserLeaveHint()

Helper method for integrating automatic Picture-in-Picture. It should be called
from the activity's `onUserLeaveHint` method.

This is a static method.

#### JitsiMeetViewListener

`JitsiMeetViewListener` provides an interface apps can implement to listen to
the state of the Jitsi Meet conference displayed in a `JitsiMeetView`.

### JitsiMeetViewAdapter

A default implementation of the `JitsiMeetViewListener` interface. Apps may
extend the class instead of implementing the interface in order to minimize
boilerplate.

##### onConferenceFailed

Called when a joining a conference was unsuccessful or when there was an error
while in a conference.

The `data` `Map` contains an "error" key describing the error and a "url" key
with the conference URL.

#### onConferenceJoined

Called when a conference was joined.

The `data` `Map` contains a "url" key with the conference URL.

#### onConferenceLeft

Called when a conference was left.

The `data` `Map` contains a "url" key with the conference URL.

#### onConferenceWillJoin

Called before a conference is joined.

The `data` `Map` contains a "url" key with the conference URL.

#### onConferenceWillLeave

Called before a conference is left.

The `data` `Map` contains a "url" key with the conference URL.

#### onLoadConfigError

Called when loading the main configuration file from the Jitsi Meet deployment
fails.

The `data` `Map` contains an "error" key with the error and a "url" key with the
conference URL which necessitated the loading of the configuration file.

## ProGuard rules

When using the SDK on a project some proguard rules have to be added in order
to avoid necessary code being stripped. Add the following to your project's
rules file:

```
# React Native

# Keep our interfaces so they can be used by other ProGuard rules.
# See http://sourceforge.net/p/proguard/bugs/466/
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Do not strip any method/class that is annotated with @DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.UIProp <fields>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**

# TextLayoutBuilder uses a non-public Android constructor within StaticLayout.
# See libs/proxy/src/main/java/com/facebook/fbui/textlayoutbuilder/proxy for details.
-dontwarn android.text.StaticLayout

# okhttp

-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# okio

-keep class sun.misc.Unsafe { *; }
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn okio.**

# WebRTC

-keep class org.webrtc.** { *; }
-dontwarn org.chromium.build.BuildHooksAndroid

# Jisti Meet SDK

-keep class org.jitsi.meet.sdk.** { *; }
```

## Picture-in-Picture

`JitsiMeetView` will automatically adjust its UI when presented in a
Picture-in-Picture style scenario, in a rectangle too small to accommodate its
"full" UI.

Jitsi Meet SDK automatically enables (unless explicitly disabled by a
`setPictureInPictureEnabled(false)` call) Android's native Picture-in-Picture
mode iff the platform is supported i.e. Android >= Oreo.

## Dropbox integration

To setup the Dropbox integration, follow these steps:

1. Add the following to the app's AndroidManifest.xml and change `<APP_KEY>` to
your Dropbox app key:
```
<activity
    android:configChanges="keyboard|orientation"
    android:launchMode="singleTask"
    android:name="com.dropbox.core.android.AuthActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.BROWSABLE" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:scheme="db-<APP_KEY>" />
  </intent-filter>
</activity>
```

2. Add the following to the app's strings.xml and change `<APP_KEY>` to your
Dropbox app key:
```
<string name="dropbox_app_key"><APP_KEY></string>
```
