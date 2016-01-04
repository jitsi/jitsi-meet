JWT token authentication Prosody plugin
==================

This plugin implements Prosody authentication provider that verifies client connection based on JWT token described in [RFC7519].
It allows to use any external form of authentication with lib-jitsi-meet. Once your user authenticates you need to
generate the JWT token as described in the RFC and pass it to your client app. Once it connects with valid token is considered authenticated by jitsi-meet system.

During configuration you will need to provide the *application ID* that identifies the client and a *secret* shared by both server and JWT token generator. Like described in the RFC, secret is used to compute HMAC hash value which allows to authenticate generated token. There are many existing libraries which can be used to implement token generator. More info can be found here: [http://jwt.io/#libraries-io]

JWT token authentication currently works only with BOSH connections.

[RFC7519]: https://tools.ietf.org/html/rfc7519
[http://jwt.io/#libraries-io]: http://jwt.io/#libraries-io

### Token structure

The following JWT claims are used in authentication token:
- 'issuer' specifies *application ID* which identifies the client app connecting to the server
- 'room' contains the name of the room for which the token has been allocated. This is *NOT* full MUC room address. Example assuming that we have full MUC 'conference1@muc.server.net' then 'conference1' should be used here.
- 'exp' token expiration timstamp as defined in the RFC

Secret is used to compute HMAC hash value and verify the token.

### Token verification

JWT token is currently checked in 2 places:
- when user connects to Prosody through BOSH. Token value is passed as 'token' query paramater of BOSH URL. User uses XMPP anonymous authentication method.
- when MUC room is being created/joined Prosody compares 'room' claim with the actual name of the room. This prevents from abusing stolen token by unathorized users to allocate new conference rooms in the system. Admin users are not required to provide valid token which is used by Jicofo for example.

### Lib-jitsi-meet options

When JWT authentication is used with *lib-jitsi-meet* the token is passed to *JitsiConference* constructor:

```
var token = {token is provided by your application possibly after some authentication}

JitsiMeetJS.init(initOptions).then(function(){
    connection = new JitsiMeetJS.JitsiConnection(APP_ID, token, options);
    ...
    connection.connect();
});

```

### Jitsi-meet options

In order to start jitsi-meet conference with token you need to specify the token as URL param:
```
https://example.com/angrywhalesgrowhigh#config.token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
```
At current level of integration every user that joins the conference has to provide the token and not just the one who
creates the room. It should be possible to change that by using second anonymous domain, but that hasn't been tested
yet.



### Installing token plugin

Token authentication can be integrated automatically using Debian package install. Once you have jitsi-meet installed
just install 'jitsi-meet-tokens' on top of it. In order to have it configured automatically at least version 779 of
jitsi-meet is required which comes with special Prosody config template.

```
apt-get install jitsi-meet-token
```

Proceed to "Patching Prosody" section to finish configuration.

### Patching Prosody

JWT token authentication requires prosody-trunk version at least 607.

You can download latest prosody-trunk packages from [here]. Then install it with the following command:

```
sudo dpkg -i prosody-trunk_1nightly607-1~trusty_amd64.deb
```

Make sure that */etc/prosody/prosody.cfg.lua* contains the line below at the end to include meet host config. That's because Prosody nightly may come with slightly different default config:

```
Include "conf.d/*.cfg.lua"
```

Also check if client to server encryption is not enforced. Otherwise token authentication won't work:
```
c2s_require_encryption=false
```

[here]: http://packages.prosody.im/debian/pool/main/p/prosody-trunk/

### Manual plugin configuration

Modify your Prosody config with these three steps:

\1. Adjust *plugin_paths* to contain the path pointing to jitsi meet Prosody plugins location. That's where plugins are copied on *jitsi-meet-token* package install. This should be included in global config section(possibly at the beginning of your host config file).

```lua
plugin_paths = { "/usr/share/jitsi-meet/prosody-plugins/" }
```

\2. Under you domain config change authentication to "token" and provide application ID, secret and optionally token lifetime:

```lua
VirtualHost "jitmeet.example.com"
    authentication = "token";
    app_id = "example_app_id";             -- application identifier
    app_secret = "example_app_secret";     -- application secret known only to your token
    									   -- generator and the plugin
```

\3. Enable token verification plugin in your MUC component config section:

```lua
Component "conference.jitmeet.example.com" "muc"
    modules_enabled = { "token_verification" }
```
