// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Icon, IconHorizontalPoints } from '../../base/icons';
import { getIsParticipantAudioMuted, getIsParticipantVideoMuted } from '../../base/tracks';
import { ACTION_TRIGGER, MEDIA_STATE } from '../constants';
import { getParticipantAudioMediaState } from '../functions';

import { ParticipantItem } from './ParticipantItem';
import ParticipantQuickAction from './ParticipantQuickAction';
import { useButtonStyles } from './styled';


type Props = {

    /**
     * Additional class name.
     */
    className: string,

    /**
     * Is this item highlighted
     */
    isHighlighted: boolean,

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Callback for the activation of this item's context menu
     */
    onContextMenu: Function,

    /**
     * Callback for the mouse leaving this item
     */
    onLeave: Function,

    /**
     * Callback used for opening the drawer.
     */
    openDrawer: Function,

    /**
     * If an overflow drawer is visible.
     */
    overflowDrawer: boolean,

    /**
     * Participant reference
     */
    participant: Object
};

const useStyles = makeStyles(() => {
    return {
        ellipsis: {
            padding: 6
        }
    };
});

export const MeetingParticipantItem = ({
    className,
    isHighlighted,
    muteAudio,
    onContextMenu,
    onLeave,
    openDrawer,
    overflowDrawer,
    participant
}: Props) => {
    const { t } = useTranslation();
    const buttonClasses = useButtonStyles();
    const classes = useStyles();
    const isAudioMuted = useSelector(getIsParticipantAudioMuted(participant));
    const isVideoMuted = useSelector(getIsParticipantVideoMuted(participant));
    const audioMediaState = useSelector(getParticipantAudioMediaState(participant, isAudioMuted));
    const openDrawerForParticipant = useCallback(
        () => openDrawer(participant), [ openDrawer, participant ]);
    const onClick = overflowDrawer && !participant.local ? openDrawerForParticipant : undefined;

    return (
        <ParticipantItem
            actionsTrigger = { ACTION_TRIGGER.HOVER }
            audioMediaState = { audioMediaState }
            className = { className }
            isHighlighted = { isHighlighted }
            onClick = { onClick }
            onLeave = { onLeave }
            participant = { participant }
            videoMuteState = { isVideoMuted ? MEDIA_STATE.MUTED : MEDIA_STATE.UNMUTED }>
            {
                !overflowDrawer && <>
                    <ParticipantQuickAction
                        isAudioMuted = { isAudioMuted }
                        muteAudio = { muteAudio }
                        participant = { participant } />
                    <button
                        aria-label = { t('MeetingParticipantItem.ParticipantActionEllipsis.options') }
                        className = { clsx(buttonClasses.button, classes.ellipsis) }
                        onClick = { onContextMenu }>
                        <Icon src = { IconHorizontalPoints } />
                    </button>
                    </>
            }

        </ParticipantItem>
    );
};
