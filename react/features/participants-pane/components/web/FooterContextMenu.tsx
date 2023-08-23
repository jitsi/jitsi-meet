import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
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
import { openDialog } from '../../../base/dialog/actions';
import {
    IconCheck,
    IconDotsHorizontal,
    IconVideoOff
} from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getParticipantCount,
    isEveryoneModerator
} from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { openSettingsDialog } from '../../../settings/actions.web';
import { SETTINGS_TABS } from '../../../settings/constants';
import { shouldShowModeratorSettings } from '../../../settings/functions.web';
import MuteEveryonesVideoDialog from '../../../video-menu/components/web/MuteEveryonesVideoDialog';

const useStyles = makeStyles()(theme => {
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
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
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

interface IProps {

    /**
     * Whether the menu is open.
     */
    isOpen: boolean;

    /**
     * Drawer close callback.
     */
    onDrawerClose: (e?: React.MouseEvent) => void;

    /**
     * Callback for the mouse leaving this item.
     */
    onMouseLeave?: (e?: React.MouseEvent) => void;
}

export const FooterContextMenu = ({ isOpen, onDrawerClose, onMouseLeave }: IProps) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector((state: IReduxState) => isAvModerationSupported()(state));
    const allModerators = useSelector(isEveryoneModerator);
    const isModeratorSettingsTabEnabled = useSelector(shouldShowModeratorSettings);
    const participantCount = useSelector(getParticipantCount);
    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));
    const isBreakoutRoom = useSelector(isInBreakoutRoom);

    const { t } = useTranslation();

    const disableAudioModeration = useCallback(() => dispatch(requestDisableAudioModeration()), [ dispatch ]);

    const disableVideoModeration = useCallback(() => dispatch(requestDisableVideoModeration()), [ dispatch ]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableAudioModeration()), [ dispatch ]);

    const enableVideoModeration = useCallback(() => dispatch(requestEnableVideoModeration()), [ dispatch ]);

    const { classes } = useStyles();

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

    return (
        <ContextMenu
            activateFocusTrap = { true }
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
            {!isBreakoutRoom && isModerationSupported && (participantCount === 1 || !allModerators) && (
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
                        icon: IconDotsHorizontal,
                        onClick: openModeratorSettings,
                        text: t('participantsPane.actions.moreModerationControls')
                    } ] } />
            )}
        </ContextMenu>
    );
};
