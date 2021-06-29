// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { type Node } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Avatar } from '../../base/avatar';
import {
    Icon,
    IconCameraEmpty,
    IconCameraEmptyDisabled,
    IconMicrophoneEmpty,
    IconMicrophoneEmptySlash
} from '../../base/icons';
import { getParticipantDisplayNameWithId } from '../../base/participants';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { ACTION_TRIGGER, MEDIA_STATE, type ActionTrigger, type MediaState } from '../constants';

import ColoredIcon from './ColoredIcon';
import { RaisedHandIndicator } from './RaisedHandIndicator';

const useStyles = makeStyles(theme => {
    return {
        actions: {
            alignItems: 'center',
            zIndex: 1,

            '& > *:not(:last-child)': {
                marginRight: 8
            }
        },

        actionsHover: {
            backgroundColor: '#292929',
            bottom: '1px',
            display: 'none',
            position: 'absolute',
            right: 16,
            top: 0,

            '&:after': {
                content: '',
                background: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, #292929 100%)',
                bottom: 0,
                display: 'block',
                left: 0,
                pointerEvents: 'none',
                position: 'absolute',
                top: '0',
                transform: 'translateX(-100%)',
                width: 40
            }
        },
        actionsPermanent: {
            display: 'flex'
        },
        avatar: {
            margin: '8px 16px 8px 0'
        },
        container: {
            alignItems: 'center',
            boxShadow: 'inset 0px -1px 0px rgba(255, 255, 255, 0.15)',
            color: theme.palette.text01,
            display: 'flex',
            height: 48,
            margin: '0 -16px',
            paddingLeft: 16,
            position: 'relative',
            ...withPixelLineHeight(theme.typography.bodyShortRegular),

            '&:hover': {
                boxShadow: 'none',
                backgroundColor: theme.palette.ui02,

                '& $actionsHover': {
                    display: 'flex'
                }
            },
            '@media (max-width: 580px)': {
                ...withPixelLineHeight(theme.typography.bodyShortRegularLarge)
            }
        },
        content: {
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            paddingRight: 16
        },
        name: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        nameContainer: {
            display: 'flex',
            flex: 1,
            marginRight: 8,
            overflow: 'hidden'
        },

        states: {
            display: 'flex',
            justifyContent: 'flex-end',

            '& > *': {
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center'
            },

            '& > *:not(:last-child)': {
                marginRight: 8
            }
        }
    };
});

const actionClassMap = {
    [ACTION_TRIGGER.HOVER]: 'actionsHover',
    [ACTION_TRIGGER.PERMANENT]: 'actionsPermanent'
};

/**
 * Icon mapping for possible participant audio states.
 */
const AudioStateIcons: {[MediaState]: React$Element<any> | null} = {
    [MEDIA_STATE.FORCE_MUTED]: (
        <ColoredIcon
            src = { IconMicrophoneEmptySlash }
            type = { MEDIA_STATE.FORCE_MUTED } />
    ),
    [MEDIA_STATE.MUTED]: (
        <Icon
            size = { 16 }
            src = { IconMicrophoneEmptySlash } />
    ),
    [MEDIA_STATE.UNMUTED]: (
        <ColoredIcon
            src = { IconMicrophoneEmpty }
            type = { MEDIA_STATE.UNMUTED } />
    ),
    [MEDIA_STATE.NONE]: null
};

/**
 * Icon mapping for possible participant video states.
 */
const VideoStateIcons = {
    [MEDIA_STATE.FORCE_MUTED]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmptyDisabled } />
    ),
    [MEDIA_STATE.MUTED]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmptyDisabled } />
    ),
    [MEDIA_STATE.UNMUTED]: (
        <Icon
            size = { 16 }
            src = { IconCameraEmpty } />
    ),
    [MEDIA_STATE.NONE]: null
};

type Props = {

    /**
     * Type of trigger for the participant actions
     */
    actionsTrigger: ActionTrigger,

    /**
     * Media state for audio
     */
    audioMediaState: MediaState,

    /**
     * React children
     */
    children: Node,

    /**
     * Additional CSS class.
     */
    className?: string,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    name?: string,

    /**
     * Callback for when the mouse leaves this component
     */
    onLeave?: Function,

    /**
     * Callback for when the mouse leaves this component
     */
    onClick?: Function,

    /**
     * Participant reference
     */
    participant: Object,

    /**
     * Media state for video
     */
    videoMuteState: MediaState
}

export const ParticipantItem = ({
    children,
    className,
    onClick,
    onLeave,
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    videoMuteState = MEDIA_STATE.NONE,
    name,
    participant: p
}: Props) => {

    const { t } = useTranslation();
    const displayName = name || useSelector(getParticipantDisplayNameWithId(p.id));
    const classes = useStyles();

    return (
        <div
            className = { clsx(className, classes.container) }
            onClick = { onClick }
            onMouseLeave = { onLeave }
            trigger = { actionsTrigger }>
            <Avatar
                className = { classes.avatar }
                participantId = { p.id }
                size = { 32 } />
            <div className = { classes.content }>
                <div className = { classes.nameContainer }>
                    <div className = { classes.name } >
                        { displayName }
                    </div>
                    { p.local ? <span>&nbsp;({t('chat.you')})</span> : null }
                </div>
                { !p.local
                  && <div
                      className = { clsx(classes.actions, classes[actionClassMap[actionsTrigger]]) }>
                      {children}
                  </div> }
                <div className = { classes.states }>
                    {p.raisedHand && <RaisedHandIndicator />}
                    {VideoStateIcons[videoMuteState]}
                    {AudioStateIcons[audioMediaState]}
                </div>
            </div>
        </div>
    );
};
