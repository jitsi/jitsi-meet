/* global JitsiMeetJS */

// FIXME: remove once atlaskit work with React 16.
import '../base/react/prop-types-polyfill.js';

import DeviceSelectionPopup from './DeviceSelectionPopup';

let deviceSelectionPopup;

window.init = i18next => {
    JitsiMeetJS.init();
    deviceSelectionPopup = new DeviceSelectionPopup(i18next);
};

window.addEventListener('beforeunload', () => deviceSelectionPopup.close());
