# GraceTech Development

## Installation
If you're using Windows, please use WSL
-   sudo npm i patch-package -g
-   npm install
-   npm start
-   open https://127.0.0.1:8080/

## possible issue
If you see this error when running npm start
>webpack-cli] Error: error:0308010C:digital envelope routines::unsupported
>    at new Hash (node:internal/crypto/hash:71:19)
>    at Object.createHash (node:crypto:133:10)
>    at BulkUpdateDecorator.hashFactory (/mnt/f/code/jitsi-meet/node_modules/webpack/lib/util/createHash.js:155:18)
>    at BulkUpdateDecorator.digest (/mnt/f/code/jitsi-meet/node_modules/webpack/lib/util/createHash.js:80:21)
>    at /mnt/f/code/jitsi-meet/node_modules/webpack/lib/DefinePlugin.js:595:38
>    at _next28 (eval at create (/mnt/f/code/jitsi-meet/node_modules/tapable/lib/HookCodeFactory.js:19:10), <anonymous>:36:1)
>    at _next6 (eval at create (/mnt/f/code/jitsi-meet/node_modules/tapable/lib/HookCodeFactory.js:19:10), <anonymous>:97:1)
>    at Hook.eval [as call] (eval at create (/mnt/f/code/jitsi-meet/node_modules/tapable/lib/HookCodeFactory.js:19:10), <anonymous>:113:1)
>    at Hook.CALL_DELEGATE [as _call] (/mnt/f/code/jitsi-meet/node_modules/tapable/lib/Hook.js:14:14)
>    at Compiler.newCompilation (/mnt/f/code/jitsi-meet/node_modules/webpack/lib/Compiler.js:1053:26) {
>  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
>  library: 'digital envelope routines',
>  reason: 'unsupported',
>  code: 'ERR_OSSL_EVP_UNSUPPORTED'
>}

run this command before running npm start
```
NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=8192'
```
