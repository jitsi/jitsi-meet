# Jitsi Meet SDK for Android

## Build

1. Install all required [dependencies](https://github.com/jitsi/jitsi-meet/blob/master/doc/mobile.md).

2. ```bash
   cd android/
   ./gradlew :sdk:assembleRelease
   ```

3. Configure the Maven repositories in which you are going to publish the
   artifacts/binaries during step 4. Modify
   `"file:${rootProject.projectDir}/../../../jitsi/jitsi-maven-repository/releases"`
   in adroid/sdk/build.gradle for Jitsi Meet SDK for Android and/or
   `"file:${rootProject.projectDir}/../../../jitsi/jitsi-maven-repository/releases"`
   in android/build.gradle for the third-party react-native modules which Jitsi
   Meet SDK for Android depends on and are not publicly available in Maven
   repositories. Generally, if you are modifying the JavaSource code of Jitsi
   Meet SDK for Android only, you will very likely need to consider the former
   only.

4. Publish the Maven artifact/binary of Jitsi Meet SDK for Android in the Maven
   repository configured in step 3:

   ```bash
   ./gradlew :sdk:publish
   cd ../
   ```

   If you would like to publish a third-party react-native module which Jitsi
   Meet SDK for Android depends on and is not publicly available in Maven
   repositories, replace `sdk` with the name of the react-native module. For
   example, to publish react-native-webrtc:

   ```bash
   ./gradlew :react-native-webrtc:publish
   ```

## Install

Add the Maven repository
`https://github.com/jitsi/jitsi-maven-repository/raw/master/releases` and the
dependency `org.jitsi.react:jitsi-meet-sdk:1.9.0` into your `build.gradle`.

## API

Jitsi Meet SDK is an Android library which embodies the whole Jitsi Meet
experience and makes it reusable by third-party apps.

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
    protected void onPause() {
        super.onPause();

        JitsiMeetView.onHostPause(this);
    }

    @Override
    protected void onResume() {
        super.onResume();

        JitsiMeetView.onHostResume(this);
    }
}
```

### JitsiMeetActivity

This class encapsulates a high level API in the form of an Android `Activity`
which displays a single `JitsiMeetView`.

#### getDefaultURL()

See JitsiMeetView.getDefaultURL.

#### getWelcomePageEnabled()

See JitsiMeetView.getWelcomePageEnabled.

#### loadURL(URL)

See JitsiMeetView.loadURL.

#### setDefaultURL(URL)

See JitsiMeetView.setDefaultURL.

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

#### getWelcomePageEnabled()

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

NOTE: Must be called before `loadURL`/`loadURLString` for it to take effect.

#### setListener(listener)

Sets the given listener (class implementing the `JitsiMeetViewListener`
interface) on the view.

#### setWelcomePageEnabled(boolean)

Sets whether the Welcome page is enabled. See `getWelcomePageEnabled` for more
information.

NOTE: Must be called before `loadURL`/`loadURLString` for it to take effect.

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

Helper method which should be called from the activity's `onResume` method.

This is a static method.

#### onNewIntent(intent)

Helper method for integrating the *deep linking* functionality. If your app's
activity is launched in "singleTask" mode this method should be called from the
activity's `onNewIntent` method.

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
