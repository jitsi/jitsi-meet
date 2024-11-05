import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IconPin, IconPinned } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { togglePinStageParticipant } from '../../../filmstrip/actions.web';
import { getPinnedActiveParticipants } from '../../../filmstrip/functions.web';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

interface IProps extends IButtonProps {

    /**
     * Button text class name.
     */
    className?: string;

    /**
     * Whether the icon should be hidden or not.
     */
    noIcon?: boolean;

    /**
     * Click handler executed aside from the main action.
     */
    onClick?: Function;
}

const TogglePinToStageButton = ({
    className,
    noIcon = false,
    notifyClick,
    notifyMode,
    onClick,
    participantID
}: IProps): JSX.Element => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isActive = Boolean(useSelector(getPinnedActiveParticipants)
        .find(p => p.participantId === participantID));
    const _onClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(togglePinStageParticipant(participantID));
        onClick?.();
    }, [ dispatch, isActive, notifyClick, onClick, participantID ]);

    const text = isActive
        ? t('videothumbnail.unpinFromStage')
        : t('videothumbnail.pinToStage');

    const icon = isActive ? IconPinned : IconPin;

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { noIcon ? null : icon }
            onClick = { _onClick }
            text = { text }
            textClassName = { className } />
    );
};

export default TogglePinToStageButton;
