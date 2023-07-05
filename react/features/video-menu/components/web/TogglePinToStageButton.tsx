import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IconPin, IconPinned } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { togglePinStageParticipant } from '../../../filmstrip/actions.web';
import { getPinnedActiveParticipants } from '../../../filmstrip/functions.web';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';

interface IProps {

    /**
     * The button key used to identify the click event.
     */
    buttonKey: string;

    /**
     * Button text class name.
     */
    className?: string;

    /**
     * Whether the icon should be hidden or not.
     */
    noIcon?: boolean;

    /**
     * Callback to execute when the button is clicked.
     */
    notifyClick?: Function;

    /**
     * Notify mode for `participantMenuButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * Click handler executed aside from the main action.
     */
    onClick?: Function;

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string;
}

const TogglePinToStageButton = ({
    buttonKey, className, noIcon = false, notifyClick, notifyMode, onClick, participantID
}: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isActive = Boolean(useSelector(getPinnedActiveParticipants)
        .find(p => p.participantId === participantID));
    const _onClick = useCallback(() => {
        notifyClick?.(buttonKey, participantID);
        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            dispatch(togglePinStageParticipant(participantID));
            onClick?.();
        }
    }, [
        buttonKey,
        dispatch,
        isActive,
        notifyClick,
        onClick,
        participantID,
        togglePinStageParticipant
    ]);

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
