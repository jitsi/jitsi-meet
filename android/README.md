# Jitsi Meet for Android

This directory contains the source code for Jitsi Meet for Android (the
application) and the Jitsi Meet SDK for Android.

## Jitsi Meet SDK

Jitsi Meet SDK is an Android library which embodies the Jitsi Meet experience,
gift-wrapped so other applications can use it. Example use:

```java
package org.jitsi.example;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import org.jitsi.meet.sdk.*;


public class CustomActivity extends AppCompatActivity {
    private JitsiMeetView jitsiMeetView;

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

        jitsiMeetView = new JitsiMeetView(this);
        jitsiMeetView.loadURL(null);

        setContentView(jitsiMeetView);
    }

    @Override
    public void onNewIntent(Intent intent) {
        JitsiMeetView.onNewIntent(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        JitsiMeetView.onHostDestroy(this);
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

Alternatively, you can use the `JitsiMeetBaseActivity` class, which already has
all activity lifecycle methods hooked up:

```java
package org.jitsi.example;

import org.jitsi.meet.sdk.*;


public class MainActivity extends JitsiMeetBaseActivity {
}

```

### JitsiMeetBaseActivity

This class encapsulates a high level API in the form of an Android activity
which displays a single `JitsiMeetView` views.

#### loadURL(url)

See JitsiMeetView.loadURL.


### JitsiMeetView

The `JitsiMeetView` class is the core of Jitsi Meet SDK. It's designed to
display a Jitsi Meet conference view (or a welcome page).

#### getListener()

Returns the `JitsiMeetView.Listener` instance attached to the view.

#### loadURL(url)

Loads the given URL and joins the conference which is being pointed to. If null,
it will load the welcome page.

#### setListener(listener)

Sets the given listener (class implementing the `JitsiMeetView.Listener`
interface) on the view.

#### onBackPressed()

Helper method which should be called from the activity's `onBackPressed` method.
If this function returns `true` it means the action was handled and thus no
extra processing is required, otherwise the application should call the parent's
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

Helper method for integrating the *deep linking* functionality. If your
application's activity is launched in "singleTask" mode this method should
be called from the activity's `onNewIntent` method.

This is a static method.

#### Listener

JitsiMeetView.Listener provides an interface applications can implement in order
to get notified about the state of the Jitsi Meet conference.

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

