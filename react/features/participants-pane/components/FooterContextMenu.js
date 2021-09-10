// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
    requestDisableAudioModeration,
    requestDisableVideoModeration,
    requestEnableAudioModeration,
    requestEnableVideoModeration
} from '../../av-moderation/actions';
import {
    isEnabled as isAvModerationEnabled,
    isSupported as isAvModerationSupported
} from '../../av-moderation/functions';
import { openDialog } from '../../base/dialog';
import { Icon, IconCheck, IconVideoOff } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import {
    getParticipantCount,
    isEveryoneModerator
} from '../../base/participants';
import { MuteEveryonesVideoDialog } from '../../video-menu/components';

import {
    ContextMenu,
    ContextMenuItem,
    ContextMenuItemGroup
} from './web/styled';

const useStyles = makeStyles(() => {
    return {
        contextMenu: {
            bottom: 'auto',
            margin: '0',
            padding: '8px 0',
            right: 0,
            top: '-8px',
            transform: 'translateY(-100%)',
            width: '283px'
        },
        drawer: {
            width: '100%',
            top: 'auto',
            bottom: 0,
            transform: 'none',
            position: 'relative',

            '& > div': {
                lineHeight: '32px'
            }
        },
        text: {
            color: '#C2C2C2',
            padding: '10px 16px 10px 52px'
        },
        paddedAction: {
            marginLeft: '36px;'
        }
    };
});

type Props = {

    /**
     * Whether the menu is displayed inside a drawer.
     */
    inDrawer?: boolean,

    /**
     * Callback for the mouse leaving this item.
     */
    onMouseLeave?: Function
};

export const FooterContextMenu = ({ inDrawer, onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationSupported = useSelector(isAvModerationSupported());
    const allModerators = useSelector(isEveryoneModerator);
    const participantCount = useSelector(getParticipantCount);
    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));

    const { t } = useTranslation();

    const disableAudioModeration = useCallback(() => dispatch(requestDisableAudioModeration()), [ dispatch ]);

    const disableVideoModeration = useCallback(() => dispatch(requestDisableVideoModeration()), [ dispatch ]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableAudioModeration()), [ dispatch ]);

    const enableVideoModeration = useCallback(() => dispatch(requestEnableVideoModeration()), [ dispatch ]);

    const classes = useStyles();

    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog)), [ dispatch ]);

    return (
        <ContextMenu
            className = { clsx(classes.contextMenu, inDrawer && clsx(classes.drawer)) }
            onMouseLeave = { onMouseLeave }>
            <ContextMenuItemGroup>
                <ContextMenuItem
                    id = 'participants-pane-context-menu-stop-video'
                    onClick = { muteAllVideo }>
                    <Icon
                        size = { 20 }
                        src = { IconVideoOff } />
                    <span>{ t('participantsPane.actions.stopEveryonesVideo') }</span>
                </ContextMenuItem>
            </ContextMenuItemGroup>
            {isModerationSupported && (participantCount === 1 || !allModerators) ? (
                <ContextMenuItemGroup>
                    <div className = { classes.text }>
                        {t('participantsPane.actions.allow')}
                    </div>
                    { isAudioModerationEnabled ? (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-stop-audio-moderation'
                            onClick = { disableAudioModeration }>
                            <span className = { classes.paddedAction }>
                                {t('participantsPane.actions.audioModeration') }
                            </span>
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-start-audio-moderation'
                            onClick = { enableAudioModeration }>
                            <Icon
                                size = { 20 }
                                src = { IconCheck } />
                            <span>{t('participantsPane.actions.audioModeration') }</span>
                        </ContextMenuItem>
                    )}
                    { isVideoModerationEnabled ? (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-stop-video-moderation'
                            onClick = { disableVideoModeration }>
                            <span className = { classes.paddedAction }>
                                {t('participantsPane.actions.videoModeration')}
                            </span>
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem
                            id = 'participants-pane-context-menu-start-video-moderation'
                            onClick = { enableVideoModeration }>
                            <Icon
                                size = { 20 }
                                src = { IconCheck } />
                            <span>{t('participantsPane.actions.videoModeration')}</span>
                        </ContextMenuItem>
                    )}
                </ContextMenuItemGroup>
            ) : undefined
            }
        </ContextMenu>
    );
};
