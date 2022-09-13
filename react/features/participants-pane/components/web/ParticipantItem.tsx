/* eslint-disable lines-around-comment */

import { Theme } from '@mui/material';
import React, { ReactElement, useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

// @ts-ignore
import { Avatar } from '../../../base/avatar';
import ListItem from '../../../base/components/participants-pane-list/ListItem';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import {
    ACTION_TRIGGER,
    AudioStateIcons,
    MEDIA_STATE,
    type ActionTrigger,
    VideoStateIcons,
    MediaState
} from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';

interface Props extends WithTranslation {

    /**
     * Type of trigger for the participant actions.
     */
    actionsTrigger?: ActionTrigger;

    /**
     * Media state for audio.
     */
    audioMediaState?: MediaState;

    /**
     * React children.
     */
    children?: ReactElement | boolean;

    /**
     * Whether or not to disable the moderator indicator.
     */
    disableModeratorIndicator?: boolean;

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName?: string;

    /**
     * Is this item highlighted/raised.
     */
    isHighlighted?: boolean;

    /**
     * Whether or not the participant is a moderator.
     */
    isModerator?: boolean;

    /**
     * True if the participant is local.
     */
    local?: boolean;

    /**
     * Callback for when the mouse leaves this component.
     */
    onLeave?: (e?: React.MouseEvent) => void;

    /**
     * Opens a drawer with participant actions.
     */
    openDrawerForParticipant?: Function;

    /**
     * If an overflow drawer can be opened.
     */
    overflowDrawer?: boolean;

    /**
     * The ID of the participant.
     */
    participantID: string;

    /**
     * True if the participant have raised hand.
     */
    raisedHand?: boolean;

    /**
     * Media state for video.
     */
    videoMediaState?: MediaState;

    /**
     * The translated "you" text.
     */
    youText?: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        nameContainer: {
            display: 'flex',
            flex: 1,
            overflow: 'hidden'
        },

        name: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        moderatorLabel: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text03
        }
    };
});

/**
 * A component representing a participant entry in ParticipantPane and Lobby.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactNode}
 */
function ParticipantItem({
    actionsTrigger = ACTION_TRIGGER.HOVER,
    audioMediaState = MEDIA_STATE.NONE,
    children,
    disableModeratorIndicator,
    displayName,
    isHighlighted,
    isModerator,
    local,
    onLeave,
    openDrawerForParticipant,
    overflowDrawer,
    participantID,
    raisedHand,
    t,
    videoMediaState = MEDIA_STATE.NONE,
    youText
}: Props) {
    const onClick = useCallback(
        () => openDrawerForParticipant?.({
            participantID,
            displayName
        }), []);

    const { classes: styles } = useStyles();

    const icon = (
        <Avatar
            className = 'participant-avatar'
            displayName = { displayName }
            participantId = { participantID }
            size = { 32 } />
    );

    const text = (
        <>
            <div className = { styles.nameContainer }>
                <div className = { styles.name }>
                    {displayName}
                </div>
                {local ? <span>&nbsp;({youText})</span> : null}
            </div>
            {isModerator && !disableModeratorIndicator && <div className = { styles.moderatorLabel }>
                {t('videothumbnail.moderator')}
            </div>}
        </>
    );

    const indicators = (
        <>
            {raisedHand && <RaisedHandIndicator />}
            {VideoStateIcons[videoMediaState]}
            {AudioStateIcons[audioMediaState]}
        </>
    );

    return (
        <ListItem
            actions = { children }
            hideActions = { local }
            icon = { icon }
            id = { `participant-item-${participantID}` }
            indicators = { indicators }
            isHighlighted = { isHighlighted }
            onClick = { !local && overflowDrawer ? onClick : undefined }
            onMouseLeave = { onLeave }
            textChildren = { text }
            trigger = { actionsTrigger } />
    );
}

export default translate(ParticipantItem);
