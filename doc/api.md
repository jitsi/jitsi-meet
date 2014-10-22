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
api.executeCommand('displayName', ['New Nickname']);
```
* **muteAudio** - mutes / unmutes the audio for the local participant. No arguments are required.
```
api.executeCommand('muteAudio', [])
```
* **muteVideo** - mutes / unmutes the video for the local participant. No arguments are required.
```
api.executeCommand('muteVideo', [])
```
* **filmStrip** - hides / shows the film strip. No arguments are required.
```
api.executeCommand('filmStrip', [])
```

You can also execute multiple commands using the method ```executeCommands```. 
```
api.executeCommands(commands)
```
The ```commands``` parameter is object with keys the names of the commands and values the arguments for the
commands.

```
api.executeCommands({displayName: ['nickname'], muteAudio: []});
```

You can also remove the embedded Jitsi Meet Conference with the following code:
```
api.dispose()
```

It is a good practice to remove the conference before the page is unloaded. 