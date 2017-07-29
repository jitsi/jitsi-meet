# Jitsi Meet SDK for Android

This directory contains the source code of the Jitsi Meet app and the Jitsi Meet
SDK for Android.

## Jitsi Meet SDK

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

#### getWelcomePageEnabled()

See JitsiMeetView.getWelcomePageEnabled.

#### loadURL(URL)

See JitsiMeetView.loadURL.

#### setWelcomePageEnabled(boolean)

See JitsiMeetView.setWelcomePageEnabled.

### JitsiMeetView

The `JitsiMeetView` class is the core of Jitsi Meet SDK. It's designed to
display a Jitsi Meet conference (or a welcome page).

#### dispose()

Releases all resources associated with this view. This method MUST be called
when the Activity holding this view is going to be destroyed, usually in the
`onDestroy()` method.

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
Bundle configOverwrite = new Bundle();
configOverwrite.putBoolean("startWithAudioMuted", true);
configOverwrite.putBoolean("startWithVideoMuted", false);
Bundle urlBundle = new Bundle();
urlBundle.putBundle("configOverwrite", configOverwrite);
urlBundle.putString("url", "https://meet.jit.si/Test123");
view.loadURLObject(urlBundle);
```

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

The `data` HashMap contains an "error" key describing the error and a "url"
key with the conference URL.

#### onConferenceJoined

Called when a conference was joined.

The `data` HashMap contains a "url" key with the conference URL.

#### onConferenceLeft

Called when a conference was left.

The `data` HashMap contains a "url" key with the conference URL.

#### onConferenceWillJoin

Called before a conference is joined.

The `data` HashMap contains a "url" key with the conference URL.

#### onConferenceWillLeave

Called before a conference is left.

The `data` HashMap contains a "url" key with the conference URL.
