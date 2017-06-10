import 'aui-css';
import 'aui-experimental-css';

import DeviceSelectionPopup from './DeviceSelectionPopup';

let deviceSelectionPopup;

window.init = function(i18next) {
    deviceSelectionPopup = new DeviceSelectionPopup(i18next);
};

window.addEventListener('beforeunload', () =>
    deviceSelectionPopup.close());
