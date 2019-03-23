# Configuring sipgw jibri with jitsi-meet

This document describes how you can configure jitsi-meet to use sipgw jibri and enable rooms in 'Add people dialog'
You will need a working deployment of jibri configured to use a regular sip video device, for more info check out the [jibri documentation](https://github.com/jitsi/jibri/blob/master/README.md).

This feature is available for non-guests of the system, so this relies on setting in config.js ``enableUserRolesBasedOnToken: true`` and providing a jwt token when accessing the conference.

* Jicofo configuration:
edit /etc/jitsi/jicofo/sip-communicator.properties (or similar), set the appropriate MUC to look for the Jibri Controllers. This should be the same MUC as is referenced in jibri's config.json file. Restart Jicofo after setting this property.

```
  org.jitsi.jicofo.jibri.SIP_BREWERY=TheSipBrewery@conference.yourdomain.com
 ```

* Jitsi Meet configuration:
 - config.js: add 
```
  enableUserRolesBasedOnToken: true,
  peopleSearchQueryTypes: ['conferenceRooms'],
  peopleSearchUrl: 'https://api.yourdomain.com/testpath/searchpeople',
```

The combination of the above settings and providing a jwt token will enable a button under invite option which will show the dialog 'Add people'.

## People search service

When searching in the dialog, a request for results is made to the `peopleSearchUrl` service.

The request is in the following format:
```
https://api.yourdomain.com/testpath/searchpeople?query=testroomname&queryTypes=[%22conferenceRooms%22]&jwt=somejwt
```
The parameters are:
 - query - The text entered by the user.
 - queryTypes - What type of results we want people, rooms, conferenceRooms. This is the value from config.js `peopleSearchQueryTypes`
 - jwt - The token used by the user to access the conference.

The response of the service is a json in the following format:
```
[
   {
       "id": "address@sip.domain.com",
       "name": "Some room name",
       "type": "videosipgw"
   },
  {
      "id": "address2@sip.domain.com",
      "name": "Some room name2",
      "type": "videosipgw"
  }
]
```
Type should be `videosipgw`, `name` is the name shown to the user and `id` is the sip address to be called by the sipgw jibri.
