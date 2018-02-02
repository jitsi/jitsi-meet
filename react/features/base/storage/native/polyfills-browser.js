import Storage from './Storage';

(global => {

    // localStorage
    if (typeof global.localStorage === 'undefined') {
        global.localStorage = new Storage('@jitsi-meet/');
    }

    // sessionStorage
    //
    // Required by:
    // - herment
    // - Strophe
    if (typeof global.sessionStorage === 'undefined') {
        global.sessionStorage = new Storage();
    }

})(global || window || this); // eslint-disable-line no-invalid-this
