import 'aui-css';
import 'aui-experimental-css';

import DeviceSelectionPopup from './DeviceSelectionPopup';

declare var JitsiMeetJS: Object;

let deviceSelectionPopup;

window.init = function(i18next) {
    JitsiMeetJS.init({}).then(() => {
        deviceSelectionPopup = new DeviceSelectionPopup(i18next);
    });
};

window.addEventListener('beforeunload', () =>
    deviceSelectionPopup.close());
