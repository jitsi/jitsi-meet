/* application specific logic */

import 'jquery';
import 'jquery-contextmenu';
import 'jquery-ui';
import 'strophe';
import 'strophe-disco';
import 'jQuery-Impromptu';
import 'autosize';

import 'aui';
import 'aui-experimental';
import 'aui-css';
import 'aui-experimental-css';

window.toastr = require('toastr');

export conference from './conference';
export API from './modules/API';
export keyboardshortcut from './modules/keyboardshortcut/keyboardshortcut';
export remoteControl from './modules/remotecontrol/RemoteControl';
export settings from './modules/settings/Settings';
export translation from './modules/translation/translation';
export UI from './modules/UI/UI';

// Used by do_external_connect.js if we receive the attach data after connect
// was already executed. status property can be 'initialized', 'ready', or
// 'connecting'. We are interested in 'ready' status only which means that
// connect was executed but we have to wait for the attach data. In status
// 'ready' handler property will be set to a function that will finish the
// connect process when the attach data or error is received.
export const connect = {
    handler: null,
    status: 'initialized'
};

// Used for automated performance tests
export const connectionTimes = {
    'index.loaded': window.indexLoadedTime
};

// TODO The execution of the mobile app starts from react/index.native.js.
// Similarly, the execution of the Web app should start from react/index.web.js
// for the sake of consistency and ease of understanding. Temporarily though
// because we are at the beginning of introducing React into the Web app, allow
// the execution of the Web app to start from app.js in order to reduce the
// complexity of the beginning step.
import './react';
