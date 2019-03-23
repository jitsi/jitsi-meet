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

<details>
<summary>Show building instructions</summary>

Start by making sure that your development environment [is set up correctly](https://github.com/jitsi/jitsi-meet/blob/master/doc/mobile.md).

A note on dependencies: Apart from the SDK, Jitsi also publishes a binary Maven artifact for some of the SDK dependencies (that are not otherwise publicly available) to the Jitsi Maven repository. When you're planning to use a SDK that is built from source, you'll likely use a version of the source code that is newer (or at least _different_) than the version of the source that was used to create the binary SDK artifact. As a consequence, the dependencies that your project will need, might also be different from those that are published in the Jitsi Maven repository. This might lead to build problems, caused by dependencies that are unavailable.

If you want to use a SDK that is built from source, you will likely benefit from composing a local Maven repository that contains these dependencies. The text below describes how you create a repository that includes both the SDK as well as these dependencies. For illustration purposes, we'll define the location of this local Maven repository as `/tmp/repo`

In source code form, the Android SDK dependencies are locked/pinned by package.json and package-lock.json of the Jitsi Meet project. To obtain the data, execute NPM in the parent directory:

    $ (cd ..; npm install)

This will pull in the dependencies in either binary format, or in source code format, somewhere under /node_modules/

At the time of writing, there are two packages pulled in in binary format.

To copy React Native to your local Maven repository, you can simply copy part of the directory structure that was pulled in by NPM:

    $ cp -r ../node_modules/react-native/android/com /tmp/repo/

Alternatively, you can use the scripts located in the android/scripts directory to publish these dependencies to your Maven repo.

Third-party React Native _modules_, which Jitsi Meet SDK for Android depends on, are download by NPM in source code form. These need to be assembled into Maven artifacts, and then published to your local Maven repository. The SDK project facilitates this.

To prepare, Configure the Maven repositories in which you are going to publish the SDK artifacts/binaries. In `android/sdk/build.gradle` as well as in `android/build.gradle` modify the lines that contain:

    "file:${rootProject.projectDir}/../../jitsi-maven-repository/releases"

Change this value (which represents the Maven repository location used internally by the Jitsi Developers) to the location of the repository that you'd like to use:

    "file:/tmp/repo"

Make sure to do this in both files! Each file should require one line to be changed.

To prevent artifacts from previous builds affecting you're outcome, it's good to start with cleaning your work directories:

    $ ./gradlew clean

To create the release assembly for any _specific_ third-party React Native module that you need, you can execture the following commands, replace the module name in the examples below.

    $ ./gradlew :react-native-webrtc:assembleRelease
    $ ./gradlew :react-native-webrtc:publish

You build and publish the SDK itself in the same way:

    $ ./gradlew :sdk:assembleRelease
    $ ./gradlew :sdk:publish

Alternatively, you can assemble and publish _all_ subprojects, which include the react-native modules, but also the SDK itself, with a single command:

    $ ./gradlew clean assembleRelease publish

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

</details>

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
extends `android.view.View`.

Note that this should only be needed when `JitsiMeetActivity` cannot be used for
some reason. Extending `JitsiMeetView` requires manual wiring of the view to
the activity, using a lot of boilerplate code. Using the Activity instead of the
View is strongly recommended.

<details>
<summary>Show example</summary>

```java
package org.jitsi.example;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;

import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.ReactActivityLifecycleCallbacks;

// Example
//
public class MainActivity extends FragmentActivity implements JitsiMeetActivityInterface {
    private JitsiMeetView view;

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {
        JitsiMeetActivityDelegate.onActivityResult(
                this, requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        JitsiMeetActivityDelegate.onBackPressed();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        view = new JitsiMeetView(this);
        JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
            .setRoom("https://meet.jit.si/test123")
            .build();
        view.join(options);

        setContentView(view);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        view.dispose();
        view = null;

        JitsiMeetActivityDelegate.onHostDestroy(this);
    }

    @Override
    public void onNewIntent(Intent intent) {
        JitsiMeetActivityDelegate.onNewIntent(intent);
    }

    @Override
    public void onRequestPermissionsResult(
            final int requestCode,
            final String[] permissions,
            final int[] grantResults) {
        JitsiMeetActivityDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    protected void onResume() {
        super.onResume();

        JitsiMeetActivityDelegate.onHostResume(this);
    }

    @Override
    protected void onStop() {
        super.onStop();

        JitsiMeetActivityDelegate.onHostPause(this);
    }
}
```

</details>

Starting with SDK version 1.22, a Glide module must be provided by the host app.
This makes it possible to use the Glide image processing library from both the
SDK and the host app itself.

You can use the code in `JitsiGlideModule.java` and adjust the package name.
When building, add the following code in your `app/build.gradle` file, adjusting
the Glide version to match the one in https://github.com/jitsi/jitsi-meet/blob/master/android/build.gradle

```
// Glide
implementation("com.github.bumptech.glide:glide:${glideVersion}") {
    exclude group: "com.android.support", module: "glide"
}
implementation("com.github.bumptech.glide:annotations:${glideVersion}") {
    exclude group: "com.android.support", module: "annotations"
}
```

### JitsiMeetActivity

This class encapsulates a high level API in the form of an Android `FragmentActivity`
which displays a single `JitsiMeetView`. You can pass a URL as a `ACTION_VIEW`
on the Intent when starting it and it will join the conference, and will be
automatically terminated (finish() will be called on the activity) when the
conference ends or fails.

### JitsiMeetView

The `JitsiMeetView` class is the core of Jitsi Meet SDK. It's designed to
display a Jitsi Meet conference (or a welcome page).

#### join(options)

Joins the conference specified by the given `JitsiMeetConferenceOptions`.

#### leave()

Leaves the currently active conference. If the welcome page is enabled it will
go back to it, otherwise a black window will be shown.

#### dispose()

Releases all resources associated with this view. This method MUST be called
when the Activity holding this view is going to be destroyed, usually in the
`onDestroy()` method.

#### getListener()

Returns the `JitsiMeetViewListener` instance attached to the view.

#### setListener(listener)

Sets the given listener (class implementing the `JitsiMeetViewListener`
interface) on the view.

### JitsiMeetConferenceOptions

This object encapsulates all the options that can be tweaked when joining
a conference.

Example:

```java
JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
    .setServerURL(new URL("https://meet.jit.si"))
    .setRoom("test123")
    .setAudioMuted(false)
    .setVideoMuted(false)
    .setAudioOnly(false)
    .setWelcomePageEnabled(false)
    .build();
```

See the `JitsiMeetConferenceOptions` implementation for all available options.

### JitsiMeetActivityDelegate

This class handles the interaction between `JitsiMeetView` and its enclosing
`Activity`. Generally this shouldn't be consumed by users, because they'd be
using `JitsiMeetActivity` instead, which is already completely integrated.

All its methods are static.

#### onActivityResult(...)

Helper method to handle results of auxiliary activities launched by the SDK.
Should be called from the activity method of the same name.

#### onBackPressed()

Helper method which should be called from the activity's `onBackPressed` method.
If this function returns `true`, it means the action was handled and thus no
extra processing is required; otherwise the app should call the parent's
`onBackPressed` method.

#### onHostDestroy(...)

Helper method which should be called from the activity's `onDestroy` method.

#### onHostResume(...)

Helper method which should be called from the activity's `onResume` or `onStop`
method.

#### onHostStop(...)

Helper method which should be called from the activity's `onSstop` method.

#### onNewIntent(...)

Helper method for integrating the *deep linking* functionality. If your app's
activity is launched in "singleTask" mode this method should be called from the
activity's `onNewIntent` method.

#### onRequestPermissionsResult(...)

Helper method to handle permission requests inside the SDK. It should be called
from the activity method of the same name.

#### onUserLeaveHint()

Helper method for integrating automatic Picture-in-Picture. It should be called
from the activity's `onUserLeaveHint` method.

This is a static method.

#### JitsiMeetViewListener

`JitsiMeetViewListener` provides an interface apps can implement to listen to
the state of the Jitsi Meet conference displayed in a `JitsiMeetView`.

#### onConferenceJoined

Called when a conference was joined.

The `data` `Map` contains a "url" key with the conference URL.

#### onConferenceTerminated

Called when a conference was terminated either by user choice or due to a
failure.

The `data` `Map` contains an "error" key with the error and a "url" key
with the conference URL. If the conference finished gracefully no `error`
key will be present.

#### onConferenceWillJoin

Called before a conference is joined.

The `data` `Map` contains a "url" key with the conference URL.

## ProGuard rules

When using the SDK on a project some proguard rules have to be added in order
to avoid necessary code being stripped. Add the following to your project's
rules file: https://github.com/jitsi/jitsi-meet/blob/master/android/app/proguard-rules.pro

## Picture-in-Picture

`JitsiMeetView` will automatically adjust its UI when presented in a
Picture-in-Picture style scenario, in a rectangle too small to accommodate its
"full" UI.

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
