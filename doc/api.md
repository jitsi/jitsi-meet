# Jitsi Meet API

You can use the Jitsi Meet API to embed Jitsi Meet in to your application.

## Installation

To embed Jitsi Meet in your application you need to add the Jitsi Meet API library:

```javascript
<script src="https://meet.jit.si/external_api.js"></script>
```

The next step for embedding Jitsi Meet is to create the Jitsi Meet API object:

```javascript
<script>
    var domain = "meet.jit.si";
    var room = "JitsiMeetAPIExample";
    var width = 700;
    var height = 700;
    var api = new JitsiMeetExternalAPI(domain, room, width, height);
</script>
```

You can use the above lines to indicate where exactly you want the Jitsi Meet conference to be placed in your HTML code,
or you can specify the parent HTML element for the Jitsi Meet conference in the `JitsiMeetExternalAPI`
constructor:

```javascript
var api = new JitsiMeetExternalAPI(domain, room, width, height, htmlElement);
```

If you don't specify the room the user will enter in new conference with a random room name.

You can overwrite options set in [config.js]() and [interface_config.js](). For example, to enable the film-strip-only interface mode and disable simulcast, you can use:

```javascript
var configOverwrite = {disableSimulcast: true};
var interfaceConfigOverwrite = {filmStripOnly: true};
var api = new JitsiMeetExternalAPI(domain, room, width, height, htmlElement, configOverwrite, interfaceConfigOverwrite);
```

You can also pass jwt token to Jitsi Meet:

 ```javascript
 var jwt = "<jwt_token>";
 var noSsl = false;
 var api = new JitsiMeetExternalAPI(domain, room, width, height, htmlElement, configOverwrite, interfaceConfigOverwrite, noSsl, jwt);
 ```

## Controlling the embedded Jitsi Meet Conference

You can control the embedded Jitsi Meet conference using the `JitsiMeetExternalAPI` object by using `executeCommand`:

```javascript
api.executeCommand(command, ...arguments)
```

The `command` parameter is String object with the name of the command. The following commands are currently supported:

* **displayName** - Sets the display name of the local participant. This command requires one argument - the new display name to be set.
```javascript
api.executeCommand('displayName', 'New Nickname');
```

* **toggleAudio** - Mutes / unmutes the audio for the local participant. No arguments are required.
```javascript
api.executeCommand('toggleAudio')
```

* **toggleVideo** - Mutes / unmutes the video for the local participant. No arguments are required.
```javascript
api.executeCommand('toggleVideo')
```

* **toggleFilmStrip** - Hides / shows the film strip. No arguments are required.
```javascript
api.executeCommand('toggleFilmStrip')
```

* **toggleChat** - Hides / shows the chat. No arguments are required.
```javascript
api.executeCommand('toggleChat')
```

* **toggleContactList** - Hides / shows the contact list. No arguments are required.
```javascript
api.executeCommand('toggleContactList')
```

* **toggleShareScreen** - Starts / stops screen sharing. No arguments are required.
```javascript
api.executeCommand('toggleShareScreen')
```

* **hangup** - Hangups the call. No arguments are required.
```javascript
api.executeCommand('hangup')
```

* **email** - Changes the local email address. This command requires one argument - the new email address to be set.
```javascript
api.executeCommand('email', 'example@example.com')
```

* **avatarUrl** - Changes the local avatar URL. This command requires one argument - the new avatar URL to be set.
```javascript
api.executeCommand('avatarUrl', 'https://avatars0.githubusercontent.com/u/3671647')
```

You can also execute multiple commands using the `executeCommands` method:
```javascript
api.executeCommands(commands)
```
The `commands` parameter is an object with the names of the commands as keys and the arguments for the commands asvalues:
```javascript
api.executeCommands({displayName: ['nickname'], toggleAudio: []});
```

You can add event listeners to the embedded Jitsi Meet using the `addEventListener` method.
```javascript
api.addEventListener(event, listener)
```

The `event` parameter is a String object with the name of the event.
The `listener` parameter is a Function object with one argument that will be notified when the event occurs with data related to the event.

The following events are currently supported:

* **incomingMessage** - Event notifications about incoming
messages. The listener will receive an object with the following structure:
```javascript
{
"from": from,    // JID of the user that sent the message
"nick": nick,    // the nickname of the user that sent the message
"message": txt   // the text of the message
}
```

* **outgoingMessage** - Event notifications about outgoing
messages. The listener will receive an object with the following structure:
```javascript
{
"message": txt   // the text of the message
}
```

* **displayNameChanged** - event notifications about display name
changes. The listener will receive an object with the following structure:
```javascript
{
"jid": jid,                 // the JID of the participant that changed his display name
"displayname": displayName  // the new display name
}
```

* **participantJoined** - event notifications about new participants who join the room. The listener will receive an object with the following structure:
```javascript
{
"jid": jid   // the JID of the participant
}
```

* **participantLeft** - event notifications about participants that leave the room. The listener will receive an object with the following structure:
```javascript
{
"jid": jid   // the JID of the participant
}
```

* **videoConferenceJoined** - event notifications fired when the local user has joined the video conference. The listener will receive an object with the following structure:
```javascript
{
"roomName": room   // the room name of the conference
}
```

* **videoConferenceLeft** - event notifications fired when the local user has left the video conference. The listener will receive an object with the following structure:
```javascript
{
"roomName": room   // the room name of the conference
}
```

* **readyToClose** - event notification fired when Jitsi Meet is ready to be closed (hangup operations are completed).

You can also add multiple event listeners by using `addEventListeners`.
This method requires one argument of type Object. The object argument must
have the names of the events as keys and the listeners of the events as values.

```javascript
function incomingMessageListener(object)
{
// ...
}

function outgoingMessageListener(object)
{
// ...
}

api.addEventListeners({
    incomingMessage: incomingMessageListener,
    outgoingMessage: outgoingMessageListener})
```

If you want to remove a listener you can use `removeEventListener` method with argument the name of the event.

```javascript
api.removeEventListener("incomingMessage");
```

If you want to remove more than one event you can use `removeEventListeners` method with an Array with the names of the events as an argument.
```javascript
api.removeEventListeners(["incomingMessage", "outgoingMessageListener"]);
```

You can get the number of participants in the conference with the following API function:
```javascript
var numberOfParticipants = api.getNumberOfParticipants();
```

You can remove the embedded Jitsi Meet Conference with the following API function:
```javascript
api.dispose()
```

NOTE: It's a good practice to remove the conference before the page is unloaded.

[config.js]: https://github.com/jitsi/jitsi-meet/blob/master/config.js
[interface_config.js]: https://github.com/jitsi/jitsi-meet/blob/master/interface_config.js
