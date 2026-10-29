import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IconCameraRefresh } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { openCameraControlsDialog } from '../../actions.web';
import { isLocalPtzControllable } from '../../functions';

/**
 * The entry point to the pan, tilt and zoom controls, for the menus that show the local camera. It renders nothing
 * when the selected camera cannot be driven, so a menu never offers controls that would do nothing.
 *
 * @returns {JSX.Element | null}
 */
const CameraControlsMenuItem = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const controllable = useSelector(isLocalPtzControllable);

    const onClick = useCallback(() => {
        dispatch(openCameraControlsDialog());
    }, [ dispatch ]);

    if (!controllable) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('cameraPtz.title') }
            icon = { IconCameraRefresh }
            onClick = { onClick }
            role = 'menuitem'
            text = { t('cameraPtz.title') } />
    );
};

export default CameraControlsMenuItem;
