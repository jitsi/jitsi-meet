# Developing Jitsi Meet

## Building the sources

Node.js >= 10 and npm >= 6 are required.

On Debian/Ubuntu systems, the required packages can be installed with:
```
sudo apt-get install npm nodejs
cd jitsi-meet
npm install
```

Be aware that Ubuntu 18.04, at least, only ships with Node.js 8 in the default repositiories.  You can easily install Node.js 10 or 12 by following the instructions from [NodeSource](https://github.com/nodesource/distributions/blob/master/README.md#debinstall).

To build the Jitsi Meet application, just type
```
make
```

### Working with the library sources (lib-jitsi-meet)

By default the library is build from its git repository sources. The default dependency path in package.json is :
```json
"lib-jitsi-meet": "jitsi/lib-jitsi-meet",
```

To work with local copy you must change the path to:
```json
"lib-jitsi-meet": "file:///Users/name/local-lib-jitsi-meet-copy",
```

To make the project you must force it to take the sources as 'npm update':
```
npm install lib-jitsi-meet --force && make
```

Or if you are making only changes to the library:
```
npm install lib-jitsi-meet --force && make deploy-lib-jitsi-meet
```

Alternative way is to use [npm link](https://docs.npmjs.com/cli/link).
It allows to link `lib-jitsi-meet` dependency to local source in few steps:

```bash
cd lib-jitsi-meet

#### create global symlink for lib-jitsi-meet package
npm link

cd ../jitsi-meet

#### create symlink from the local node_modules folder to the global lib-jitsi-meet symlink
npm link lib-jitsi-meet
```

 After changes in local `lib-jitsi-meet` repository, you can rebuild it with `npm run install` and your `jitsi-meet` repository will use that modified library.
Note: when using node version 4.x, the make file of jitsi-meet do npm update which will delete the link. It is no longer the case with version 6.x.

If you do not want to use local repository anymore you should run
```bash
cd jitsi-meet
npm unlink lib-jitsi-meet
npm install
```
### Running with webpack-dev-server for development

Use it at the CLI, type
```
make dev
```

By default the backend deployment used is `alpha.jitsi.net`. You can point the Jitsi-Meet app at a different backend by using a proxy server. To do this, set the WEBPACK_DEV_SERVER_PROXY_TARGET variable:
```
export WEBPACK_DEV_SERVER_PROXY_TARGET=https://your-example-server.com
make dev
```

The app should be running at https://localhost:8080/, but there may be several additional steps required to get it working against a typical self hosted install.

#### Chrome Privacy Error

Newer versions of Chrome may block localhost under https and show `NET::ERR_CERT_INVALID` on the page. To solve this open [chrome://flags/#allow-insecure-localhost](chrome://flags/#allow-insecure-localhost) and select Enable, then press Relaunch or quit and restart Chrome.

#### Other Issues with WEBPACK_DEV_SERVER_PROXY_TARGET
If you're trying to test against your own backend instead of the Jitsi-provided development server, you will need to reconfigure several things in your nginx config to allow this to work properly.

You may see the following in Chrome or the terminal running the dev server.
```
Error occured while trying to proxy to: localhost:8080/
[HPM] Error occurred while trying to proxy request / from localhost:8080 to https://meet.example.com (ECONNRESET) (https://nodejs.org/api/errors.html#errors_common_system_errors)
```

On your public server, in ```/etc/nginx/modules-enabled/60-jitsi-meet.conf```, change the ```default turn;``` line to ```default web;``` in the ```map $ssl_preread_alpn_protocols $upstream``` section.  This disables the turn server passthrough, but will allow the http/1 dev server through.

You may also see CORS errors in the Chrome developer console, along these lines:

```
Access to XMLHttpRequest at 'https://meet.example.com/http-bind?room=development' from origin 'https://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

To resolve this, you need to add headers to nginx that allow access to server resources from a site running on localhost.  Change the ```location = /http-bind {``` section to include add_header lines.

```
location = /http-bind {
    proxy_pass      http://localhost:5280/http-bind;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $http_host;
    add_header 'Access-Control-Allow-Headers' 'Content-Type';
    add_header 'Access-Control-Allow-Origin' 'https://localhost:8080';
}
```

You could also use ```add_header 'Access-Control-Allow-Origin' '*';```, but this is not recommended.

#### Building .debs
To make a deb you can easily deploy to a public test server, ensure you have the lib-jitsi-meet sources you wish, then:
```
make
dpkg-buildpackage -A -rfakeroot -us -uc -tc
```

You'll have a bunch of .deb files in the parent directory, and can push the updated source to your server and install it with the jitsi-meet-web deb file.
