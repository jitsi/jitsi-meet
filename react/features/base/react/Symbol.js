// XXX React Native 0.41.2 does not polyfill Symbol. The React source code of
// jitsi/jitsi-meet does utilize Symbol though. However, it is satisfied with a
// ponyfill.
import Symbol from 'es6-symbol';
export { Symbol as default };
