import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconCameraRefresh } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { releaseCameraControl, requestCameraControl } from '../../actions.web';
import { PTZControlState } from '../../constants';
import { getPtzControlState, isFarEndCameraControlPermitted } from '../../functions';

interface IProps {

    /**
     * Notifies the embedding application that the button was clicked, when it asked to be told.
     */
    notifyClick?: Function;

    /**
     * Whether the embedding application only wants to be notified, or wants to handle the click itself.
     */
    notifyMode?: string;

    /**
     * The participant whose camera this is about.
     */
    participantID: string;
}

/**
 * Starts or ends a far end control session on a participant's camera. A camera that cannot be driven gets no entry
 * at all, since most cameras cannot be, and a row that never does anything is noise in every menu.
 *
 * @param {IProps} props - The props of the component.
 * @returns {JSX.Element | null}
 */
const ControlCameraButton = ({ notifyClick, notifyMode, participantID }: IProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const permitted = useSelector(isFarEndCameraControlPermitted);
    const controlState = useSelector((state: IReduxState) => getPtzControlState(state, participantID));
    const controlling = controlState === PTZControlState.CONTROLLING;

    const onClick = useCallback(() => {
        notifyClick?.();

        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }

        dispatch(controlling ? releaseCameraControl() : requestCameraControl(participantID));
    }, [ controlling, dispatch, notifyClick, notifyMode, participantID ]);

    if (!permitted || controlState === PTZControlState.UNSUPPORTED) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.controlCamera') }
            disabled = { controlState === PTZControlState.REQUESTED }
            icon = { IconCameraRefresh }
            onClick = { onClick }
            selected = { controlling }
            text = { t(controlling ? 'videothumbnail.stopControllingCamera' : 'videothumbnail.controlCamera') } />
    );
};

export default ControlCameraButton;
