import './_';

// The library lib-jitsi-meet (externally) depends on the libraries jQuery and
// Strophe
(global => {
    // jQuery
    if (typeof global.$ === 'undefined') {
        const jQuery = require('jquery');

        jQuery(global);
        global.$ = jQuery;
    }

    // Strophe
    if (typeof global.Strophe === 'undefined') {
        require('strophe');
        require('strophejs-plugins/disco/strophe.disco');
        require('strophejs-plugins/caps/strophe.caps.jsonly');
    }
})(global || window || this); // eslint-disable-line no-invalid-this

// Re-export JitsiMeetJS from the library lib-jitsi-meet to (the other features
// of) the project jitsi-meet-react.
import JitsiMeetJS from 'lib-jitsi-meet';

export { JitsiMeetJS as default };

export * from './actions';
export * from './actionTypes';
export * from './functions';
