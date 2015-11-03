Token authentication Prosody plugin
==================

This plugin implements Prosody authentication provider that verifies client connection based on authentication token.
It allows to use any external form of authentication with lib-jitsi-meet. Once your user authenticates you need to
generate the token with formula described in "Token generation mechanism" and pass it to your client app. When it
connects using valid token is considered authenticated by jitsi-meet system.

From XMPP perspective this is SASL PLAIN authentication where token is passed as a password. The username can be
supplied by your application. By default it is generated randomly in lib-jitsi-meet. Keep in mind that JiCoFo is using
"focus" as it's MUC nickname, so you should avoid allowing this name for other users. 

### Token generation mechanism

Authentication token is SHA256 hash of the following string:

*roomName + ts + appId + appSecret*

- *roomName* - the name of the conference room(must be lowercase)

- *ts* - UTC token timestamp in milliseconds which indicates the time when token has been created

- *appId* - application identifier used to distinguish between applications that are using the system. It can be any random string if you're using only one application at a time.
         
- *appSecret* - application secret which should be known only to the token generator and Prosody server

Example:

```
roomName = angrywhalesgrowhigh

ts = 1446573136000 -- corresponds to 11/03/2015 @ 5:52pm (UTC)

appId = myTestApp

appSecret = blablabla
```

Text to be hashed:

```
angrywhalesgrowhigh1446573136000myTestAppblablabla
```

The token is Sha256 hash of the text above:

```
0daad82d1ad81c718d643b71b46793af2295bb20e3eb436079e9bbd130ba1ad9
```

Once we have the token generated we concatenate it with timestamp and room name like described in "Token verification"
section. It is passed as user's password during authentication process.

### Token verification

When user connects to Prosody then SASL PLAIN authentication is being used for token authentication purpose. Username is supplied by the application and in case of jitsi-meet it is randomly generated string(can be also overridden with *config.id* property). The password is a token plus name of the conference room and UTC timestamp in milliseconds: 

```
password = token + "_" + roomName + "_" + ts;
```

The password for the example from "Token generation mechanism" section would look like this:

```
0daad82d1ad81c718d643b71b46793af2295bb20e3eb436079e9bbd130ba1ad9_angrywhalesgrowhigh_1446573136000
```

When user connects the authentication plugin first verifies the timestamp. By default the token is valid for 24 hours
and it is compared against UTC timestamp returned by the server's system clock.

When the timestamp is fine the token is being verified. The name of the room and timestamp are extracted from the
password. Application id and secret come from Prosody host config(see "Manual plugin configuration" section for detailed
info). The hash computed by the plugin is compared with the one supplied as part of the user's password.

The token is also verified whenever users tries to create new MUC room. This prevents from creating multiple rooms using
the same hash which may cause troubles in case it's stolen. Unless the user is an admin it must include it as part of
the presence stanza that creates the room:

```xml
<presence
    from='user1@example.com/desktop'
    to='angrywhalesgrowhigh@muc.example.com/somenickname'>
  <x xmlns='http://jabber.org/protocol/muc'/>
  <token xmlns='http://jitsi.org/jitmeet/auth-token'>
      0daad82d1ad81c718d643b71b46793af2295bb20e3eb436079e9bbd130ba1ad9_angrywhalesgrowhigh_1446573136000
  </token>
</presence>
```

### Lib-jitsi-meet options

When token authentication is used with *lib-jitsi-meet* the token is passed to *JitsiConference* constructor:

```
var token = {token is provided by your application possibly after some authentication}
var tokenPassword = token + "_" + roomName + "_" + ts;

JitsiMeetJS.init();

var connection = new JitsiMeetJS.JitsiConnection(APP_ID, tokenPassword, options);

connection.connect();
```

### Jitsi-meet options

In order to start jitsi-meet conference with token you need to specify the token as URL param:
```
https://example.com/angrywhalesgrowhigh#config.token="0daad82d1ad81c718d643b71b46793af2295bb20e3eb436079e9bbd130ba1ad9_angrywhalesgrowhigh_1446573136000"
```
At current level of integration every user that joins the conference has to provide the token and not just the one who
creates the room. It should be possible to change that by using second anonymous domain, but that hasn't been tested
yet.

### Installing token plugin

Token authentication can be integrated automatically using Debian package install. Once you have jitsi-meet installed
just install 'jitsi-meet-tokens' on top of it. In order to have it configured automatically at least version 721 of
jitsi-meet is required which comes with special Prosody config template.
```
apt-get install jitsi-meet-token
```

### Manual plugin configuration

Modify your Prosody config with these three steps:

1. Adjust *plugin_paths* to contain the path pointing to jitsi meet Prosody plugins location. That's where plugins are copied on *jitsi-meet-token* package install. This should be included in global config section(possibly at the beginning of your host config file).

```lua
plugin_paths = { "/usr/share/jitsi-meet/prosody-plugins/" }
```

2. Under you domain config change authentication to "token" and provide application ID, secret and optionally token lifetime:

```lua
VirtualHost "jitmeet.example.com"
    authentication = "token";
    allow_unencrypted_plain_auth = true; -- required for token authentication to work
    app_id = example_app_id;             -- application identifier
    app_secret = example_app_secret;     -- application secret known only to your token
    									 -- generator and the plugin
    token_lifetime=86400000;             -- (optional) token lifetime in milliseconds
``` 

3. Enable token verification plugin in your MUC component config section:

```lua
Component "conference.jitmeet.example.com" "muc"
    modules_enabled = { "token_verification" }
```