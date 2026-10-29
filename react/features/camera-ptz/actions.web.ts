import { openDialog } from '../base/dialog/actions';

import CameraControlsDialog from './components/web/CameraControlsDialog';

export * from './actions.any';

/**
 * Opens the pan, tilt and zoom controls for the local camera.
 *
 * @returns {Object}
 */
export function openCameraControlsDialog() {
    return openDialog('CameraControlsDialog', CameraControlsDialog);
}
