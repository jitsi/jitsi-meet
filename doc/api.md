# Jitsi Meet API

You can use the Jitsi Meet API to embed Jitsi Meet in to your application.

## Installation

To embed Jitsi Meet in your application you need to add the Jitsi Meet API library:

```javascript
<script src="https://meet.jit.si/external_api.js"></script>
```
## API

### `api = new JitsiMeetExternalAPI(domain, options)`

The next step for embedding Jitsi Meet is to create the Jitsi Meet API object.
Its constructor gets a number of options:

* **domain**: domain used to build the conference URL, "meet.jit.si" for
  example.
* **options**: object with properties - the optional arguments:
    * **roomName**: (optional) name of the room to join.
    * **width**: (optional) width for the iframe which will be created. If a number is specified it's treated as pixel units. If a string is specified the format is number followed by 'px', 'em', 'pt' or '%'.
    * **height**: (optional) height for the iframe which will be created. If a number is specified it's treated as pixel units. If a string is specified the format is number followed by 'px', 'em', 'pt' or '%'.
    * **parentNode**: (optional) HTML DOM Element where the iframe will be added as a child.
    * **configOverwrite**: (optional) JS object with overrides for options defined in [config.js].
    * **interfaceConfigOverwrite**: (optional) JS object with overrides for options defined in [interface_config.js].
    * **noSsl**: (optional, defaults to true) Boolean indicating if the server should be contacted using HTTP or HTTPS.
    * **jwt**: (optional) [JWT](https://jwt.io/) token.

Example:

```javascript
var domain = "meet.jit.si";
var options = {
    roomName: "JitsiMeetAPIExample",
    width: 700,
    height: 700,
    parentNode: document.querySelector('#meet')
}
var api = new JitsiMeetExternalAPI(domain, options);
```

You can overwrite options set in [config.js] and [interface_config.js].
For example, to enable the filmstrip-only interface mode, you can use:

```javascript
var options = {
    interfaceConfigOverwrite: {filmStripOnly: true}
};
var api = new JitsiMeetExternalAPI(domain, options);
```

You can also pass a jwt token to Jitsi Meet:

 ```javascript
var options = {
    jwt: "<jwt_token>",
    noSsl: false
};
var api = new JitsiMeetExternalAPI(domain, options);
 ```

### Controlling the embedded Jitsi Meet Conference

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

* **toggleFilmStrip** - Hides / shows the filmstrip. No arguments are required.
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
The `commands` parameter is an object with the names of the commands as keys and the arguments for the commands as values:
```javascript
api.executeCommands({displayName: ['nickname'], toggleAudio: []});
```

You can add event listeners to the embedded Jitsi Meet using the `addEventListener` method.
**NOTE: This method still exists but it is deprecated. JitsiMeetExternalAPI class extends [EventEmitter]. Use [EventEmitter] methods (`addListener` or `on`).**
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
**NOTE: This method still exists but it is deprecated. JitsiMeetExternalAPI class extends [EventEmitter]. Use [EventEmitter] methods.**

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
**NOTE: This method still exists but it is deprecated. JitsiMeetExternalAPI class extends [EventEmitter]. Use [EventEmitter] methods( `removeListener`).**
```javascript
api.removeEventListener("incomingMessage");
```

If you want to remove more than one event you can use `removeEventListeners` method with an Array with the names of the events as an argument.
**NOTE: This method still exists but it is deprecated. JitsiMeetExternalAPI class extends [EventEmitter]. Use [EventEmitter] methods.**
```javascript
api.removeEventListeners(["incomingMessage", "outgoingMessageListener"]);
```

You can get the number of participants in the conference with the following API function:
```javascript
var numberOfParticipants = api.getNumberOfParticipants();
```

You can get the iframe HTML element where Jitsi Meet is loaded with the following API function:
```javascript
var iframe = api.getIFrame();
```

You can remove the embedded Jitsi Meet Conference with the following API function:
```javascript
api.dispose()
```

NOTE: It's a good practice to remove the conference before the page is unloaded.

[config.js]: https://github.com/jitsi/jitsi-meet/blob/master/config.js
[interface_config.js]: https://github.com/jitsi/jitsi-meet/blob/master/interface_config.js
[EventEmitter]: https://nodejs.org/api/events.html
