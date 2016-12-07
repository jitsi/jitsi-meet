Jitsi Meet API
============

You can use Jitsi Meet API to embed Jitsi Meet in to your application.

Installation
==========

To embed Jitsi Meet in your application you need to add Jitsi Meet API library
```javascript
<script src="https://meet.jit.si/external_api.js"></script>
```

The next step for embedding Jitsi Meet is to create the Jitsi Meet API object
```javascript
<script>
    var domain = "meet.jit.si";
    var room = "JitsiMeetAPIExample";
    var width = 700;
    var height = 700;
    var api = new JitsiMeetExternalAPI(domain, room, width, height);
</script>
```
You can paste that lines in your html code where you want to be placed the Jitsi Meet conference
or you can specify the parent HTML element for the Jitsi Meet conference in the JitsiMeetExternalAPI
constructor.
```javascript
    var api = new JitsiMeetExternalAPI(domain, room, width, height, htmlElement);
```
If you don't specify room the user will enter in new conference with random room name.

You can overwrite options set in config.js and interface_config.js. For example, to enable the film-strip-only interface mode and disable simulcast, you can use:
```javascript
    var configOverwrite = {enableSimulcast: false};
    var interfaceConfigOverwrite = {filmStripOnly: true};
    var api = new JitsiMeetExternalAPI(domain, room, width, height, htmlElement, configOverwrite, interfaceConfigOverwrite);
```

Controlling embedded Jitsi Meet Conference
=========

You can control the embedded Jitsi Meet conference using the JitsiMeetExternalAPI object.

You can send command to Jitsi Meet conference using ```executeCommand```.
```
api.executeCommand(command, arguments)
```
The ```command``` parameter is String object with the name of the command.
The ```arguments``` parameter is array with the arguments required by the command.
If no arguments are required by the command this parameter can be omitted or you can pass empty array.
Currently we support the following commands:


* **displayName** - sets the display name of the local participant. This command requires one argument -
the new display name to be set
```
api.executeCommand('displayName', 'New Nickname');
```
* **toggleAudio** - mutes / unmutes the audio for the local participant. No arguments are required.
```
api.executeCommand('toggleAudio', [])
```
* **toggleVideo** - mutes / unmutes the video for the local participant. No arguments are required.
```
api.executeCommand('toggleVideo', [])
```
* **toggleFilmStrip** - hides / shows the film strip. No arguments are required.
```
api.executeCommand('filmStrip', [])
```
* **toggleChat** - hides / shows the chat. No arguments are required.
```
api.executeCommand('toggleChat', [])
```
* **toggleContactList** - hides / shows the contact list. No arguments are required.
```
api.executeCommand('toggleContactList', [])
```

* **toggleShareScreen** - starts / stops the screen sharing. No arguments are required.
```
api.executeCommand('toggleShareScreen', [])
```

* **hangup** - Hangups the call. No arguments are required.
```
api.executeCommand('hangup', [])
```

You can also execute multiple commands using the method ```executeCommands```.
```
api.executeCommands(commands)
```
The ```commands``` parameter is object with keys the names of the commands and values the arguments for the
commands.

```
api.executeCommands({displayName: ['nickname'], toggleAudio: []});
```

You can add event listeners to the embedded Jitsi Meet using ```addEventListener``` method.
```
api.addEventListener(event, listener)
```
The ```event``` parameter is String object with the name of the event.
The ```listener``` paramenter is Function object with one argument that will be notified when the event occurs
with data related to the event.

Currently we support the following events:

* **incomingMessage** - event notifications about incoming
messages. The listener will receive object with the following structure:
```
{
"from": from,//JID of the user that sent the message
"nick": nick,//the nickname of the user that sent the message
"message": txt//the text of the message
}
```
* **outgoingMessage** - event notifications about outgoing
messages. The listener will receive object with the following structure:
```
{
"message": txt//the text of the message
}
```
* **displayNameChanged** - event notifications about display name
change. The listener will receive object with the following structure:
```
{
jid: jid,//the JID of the participant that changed his display name
displayname: displayName //the new display name
}
```
* **participantJoined** - event notifications about new participant.
The listener will receive object with the following structure:
```
{
jid: jid //the jid of the participant
}
```
* **participantLeft** - event notifications about participant that left room.
The listener will receive object with the following structure:
```
{
jid: jid //the jid of the participant
}
```
* **videoConferenceJoined** - event notifications fired when the local user has joined the video conference.
The listener will receive object with the following structure:
```
{
roomName: room //the room name of the conference
}
```
* **videoConferenceLeft** - event notifications fired when the local user has left the video conference.
The listener will receive object with the following structure:
```
{
roomName: room //the room name of the conference
}
```

* **readyToClose** - event notification fired when Jitsi Meet is ready to be closed (hangup operations are completed).

You can also add multiple event listeners by using ```addEventListeners```.
This method requires one argument of type Object. The object argument must
have keys with the names of the events and values the listeners of the events.

```
function incomingMessageListener(object)
{
...
}

function outgoingMessageListener(object)
{
...
}

api.addEventListeners({
    incomingMessage: incomingMessageListener,
    outgoingMessage: outgoingMessageListener})
```

If you want to remove a listener you can use ```removeEventListener``` method with argument the name of the event.
```
api.removeEventListener("incomingMessage");
```

If you want to remove more than one event you can use ```removeEventListeners``` method with argument
 array with the names of the events.
```
api.removeEventListeners(["incomingMessage", "outgoingMessageListener"]);
```

You can remove the embedded Jitsi Meet Conference with the following code:
```
api.dispose()
```

It is a good practice to remove the conference before the page is unloaded.
