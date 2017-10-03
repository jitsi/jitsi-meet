/* global JitsiMeetJS */

import 'aui-css';
import 'aui-experimental-css';

import DeviceSelectionPopup from './DeviceSelectionPopup';

let deviceSelectionPopup;

window.init = i18next => {
    JitsiMeetJS.init({}).then(() => {
        deviceSelectionPopup = new DeviceSelectionPopup(i18next);
    });
};

window.addEventListener('beforeunload', () => deviceSelectionPopup.close());
