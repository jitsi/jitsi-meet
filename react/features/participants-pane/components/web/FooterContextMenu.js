// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
    requestDisableAudioModeration,
    requestDisableVideoModeration,
    requestEnableAudioModeration,
    requestEnableVideoModeration
} from '../../../av-moderation/actions';
import {
    isEnabled as isAvModerationEnabled,
    isSupported as isAvModerationSupported
} from '../../../av-moderation/functions';
import { ContextMenu, ContextMenuItemGroup } from '../../../base/components';
import { getCurrentConference } from '../../../base/conference';
import { openDialog } from '../../../base/dialog';
import {
    IconCheck,
    IconHorizontalPoints,
    IconVideoOff
} from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import {
    getParticipantCount,
    isEveryoneModerator
} from '../../../base/participants';
import { publishBreakoutRooms } from '../../../breakout-rooms/actions';
import { BREAKOUT_ROOMS_PUBLISH_FEATURE } from '../../../breakout-rooms/constants';
import { breakoutRoomsPublished } from '../../../breakout-rooms/functions';
import {
    SETTINGS_TABS,
    openSettingsDialog,
    shouldShowModeratorSettings
} from '../../../settings';
import { MuteEveryonesVideoDialog } from '../../../video-menu/components';

const useStyles = makeStyles(theme => {
    return {
        contextMenu: {
            bottom: 'auto',
            margin: '0',
            right: 0,
            top: '-8px',
            transform: 'translateY(-100%)',
            width: '283px'
        },

        text: {
            color: theme.palette.text02,
            padding: '10px 16px',
            height: '40px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
        },

        indentedLabel: {
            '& > span': {
                marginLeft: '36px'
            }
        }
    };
});

type Props = {

    /**
     * Whether the menu is open.
     */
    isOpen: boolean,

    /**
     * Drawer close callback.
     */
    onDrawerClose: Function,

    /**
     * Callback for the mouse leaving this item.
     */
    onMouseLeave?: Function
};

export const FooterContextMenu = ({ isOpen, onDrawerClose, onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector(isAvModerationSupported());
    const allModerators = useSelector(isEveryoneModerator);
    const isModeratorSettingsTabEnabled = useSelector(shouldShowModeratorSettings);
    const participantCount = useSelector(getParticipantCount);
    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));
    const published = useSelector(breakoutRoomsPublished);
    const conference = useSelector(getCurrentConference);
    const isPublishBreakoutRoomsSupported
            = conference?.getBreakoutRooms().isFeatureSupported(BREAKOUT_ROOMS_PUBLISH_FEATURE);

    const { t } = useTranslation();

    const disableAudioModeration = useCallback(() => dispatch(requestDisableAudioModeration()), [ dispatch ]);
    const toggleBreakoutRoomPublishStatus = useCallback(
        () => dispatch(publishBreakoutRooms(!published)), [ dispatch, published ]);

    const disableVideoModeration = useCallback(() => dispatch(requestDisableVideoModeration()), [ dispatch ]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableAudioModeration()), [ dispatch ]);

    const enableVideoModeration = useCallback(() => dispatch(requestEnableVideoModeration()), [ dispatch ]);

    const classes = useStyles();

    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog)), [ dispatch ]);

    const openModeratorSettings = () => dispatch(openSettingsDialog(SETTINGS_TABS.MODERATOR));

    const actions = [
        {
            accessibilityLabel: t('participantsPane.actions.audioModeration'),
            className: isAudioModerationEnabled ? classes.indentedLabel : '',
            id: isAudioModerationEnabled
                ? 'participants-pane-context-menu-stop-audio-moderation'
                : 'participants-pane-context-menu-start-audio-moderation',
            icon: !isAudioModerationEnabled && IconCheck,
            onClick: isAudioModerationEnabled ? disableAudioModeration : enableAudioModeration,
            text: t('participantsPane.actions.audioModeration')
        }, {
            accessibilityLabel: t('participantsPane.actions.videoModeration'),
            className: isVideoModerationEnabled ? classes.indentedLabel : '',
            id: isVideoModerationEnabled
                ? 'participants-pane-context-menu-stop-video-moderation'
                : 'participants-pane-context-menu-start-video-moderation',
            icon: !isVideoModerationEnabled && IconCheck,
            onClick: isVideoModerationEnabled ? disableVideoModeration : enableVideoModeration,
            text: t('participantsPane.actions.videoModeration')
        }
    ];

    if (isPublishBreakoutRoomsSupported) {
        actions.unshift(
            {
                accessibilityLabel: t('participantsPane.actions.breakoutRoomsVisible'),
                className: published ? '' : classes.indentedLabel,
                id: published
                    ? 'participants-pane-context-menu-unpublish-breakout-rooms'
                    : 'participants-pane-context-menu-publish-breakout-rooms',
                icon: published && IconCheck,
                onClick: toggleBreakoutRoomPublishStatus,
                text: t('participantsPane.actions.breakoutRoomsVisible')
            }
        );
    }

    return (
        <ContextMenu
            className = { classes.contextMenu }
            hidden = { !isOpen }
            isDrawerOpen = { isOpen }
            onDrawerClose = { onDrawerClose }
            onMouseLeave = { onMouseLeave }>
            <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: t('participantsPane.actions.stopEveryonesVideo'),
                    id: 'participants-pane-context-menu-stop-video',
                    icon: IconVideoOff,
                    onClick: muteAllVideo,
                    text: t('participantsPane.actions.stopEveryonesVideo')
                } ] } />
            {isModerationSupported && (participantCount === 1 || !allModerators) && (
                <ContextMenuItemGroup actions = { actions }>
                    <div className = { classes.text }>
                        <span>{t('participantsPane.actions.allow')}</span>
                    </div>
                </ContextMenuItemGroup>
            )}
            {isModeratorSettingsTabEnabled && (
                <ContextMenuItemGroup
                    actions = { [ {
                        accessibilityLabel: t('participantsPane.actions.moreModerationControls'),
                        id: 'participants-pane-open-moderation-control-settings',
                        icon: IconHorizontalPoints,
                        onClick: openModeratorSettings,
                        text: t('participantsPane.actions.moreModerationControls')
                    } ] } />
            )}
        </ContextMenu>
    );
};
