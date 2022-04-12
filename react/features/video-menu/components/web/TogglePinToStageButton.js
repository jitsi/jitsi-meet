// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { IconPinParticipant, IconUnpin } from '../../../base/icons';
import { togglePinStageParticipant } from '../../../filmstrip/actions.web';
import { getPinnedActiveParticipants } from '../../../filmstrip/functions.web';

type Props = {

    /**
     * Button text class name.
     */
    className: string,

    /**
     * Whether the icon should be hidden or not.
     */
    noIcon: boolean,

    /**
     * Click handler executed aside from the main action.
     */
    onClick?: Function,

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string
}

const TogglePinToStageButton = ({ className, noIcon = false, onClick, participantID }: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isActive = Boolean(useSelector(getPinnedActiveParticipants)
        .find(p => p.participantId === participantID));
    const _onClick = useCallback(() => {
        dispatch(togglePinStageParticipant(participantID));
        onClick && onClick();
    }, [ participantID, isActive ]);

    const text = isActive
        ? t('videothumbnail.unpinFromStage')
        : t('videothumbnail.pinToStage');

    const icon = isActive ? IconUnpin : IconPinParticipant;

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
