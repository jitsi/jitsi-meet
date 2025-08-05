/* application specific logic */

// Re-export jQuery
// FIXME: Remove this requirement from torture tests.
import $ from 'jquery';

window.$ = window.jQuery = $;

import 'focus-visible';

// We need to setup the jitsi-local-storage as early as possible so that we can start using it.
// NOTE: If jitsi-local-storage is used before the initial setup is performed this will break the use case when we use
// the  local storage from the parent page when the localStorage is disabled. Also the setup is relying that
// window.location is not changed and still has all URL parameters.
import './react/features/base/jitsi-local-storage/setup';
import conference from './conference';
import API from './modules/API';
import UI from './modules/UI/UI';
import translation from './modules/translation/translation';


window.APP = {
    API,
    conference,
    translation,
    UI
};

// TODO The execution of the mobile app starts from react/index.native.js.
// Similarly, the execution of the Web app should start from react/index.web.js
// for the sake of consistency and ease of understanding. Temporarily though
// because we are at the beginning of introducing React into the Web app, allow
// the execution of the Web app to start from app.js in order to reduce the
// complexity of the beginning step.
import './react';
