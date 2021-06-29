// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isToolbarButtonEnabled } from '../../base/config/functions.web';
import {
    Icon,
    IconCloseCircle,
    IconCrown,
    IconMessage,
    IconMicDisabled,
    IconMuteEveryoneElse,
    IconVideoOff
} from '../../base/icons';
import { isLocalParticipantModerator, isParticipantModerator } from '../../base/participants';
import { getIsParticipantAudioMuted, getIsParticipantVideoMuted } from '../../base/tracks';
import { useContextMenuActions } from '../functions';

import { useItemStyles } from './styled';

const useStyles = makeStyles(theme => {
    return {
        group: {
            background: theme.palette.ui02,

            '&:not(:empty)': {
                padding: '8px 0'
            },
            '& + &:not(:empty)': {
                borderTop: '1px solid #4C4D50'
            }
        },
        drawerMenu: {
            '&>div': {
                height: 48
            }
        }
    };
});

type Props = {

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Whether the actions are being displayed inside a drawer.
     */
    overflowDrawer?: boolean,

    /**
     * Participant reference
     */
    participant: Object
};

export default ({
    muteAudio,
    participant,
    overflowDrawer
}: Props) => {
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const isChatButtonEnabled = useSelector(isToolbarButtonEnabled('chat'));
    const isParticipantVideoMuted = useSelector(getIsParticipantVideoMuted(participant));
    const isParticipantAudioMuted = useSelector(getIsParticipantAudioMuted(participant));
    const {
        grantModerator,
        kick,
        muteEveryoneElse,
        muteVideo,
        sendPrivateMessage
    } = useContextMenuActions(participant);
    const { t } = useTranslation();
    const classes = useStyles();
    const { itemClass } = useItemStyles();

    return (
        <>
            <div className = { clsx(classes.group, overflowDrawer && classes.drawerMenu) }>
                {isLocalModerator && (
                <>
                    {!isParticipantAudioMuted
                     && <div
                         className = { itemClass }
                         onClick = { muteAudio(participant) }>
                         <Icon
                             size = { 20 }
                             src = { IconMicDisabled } />
                         <span>{t('dialog.muteParticipantButton')}</span>
                     </div>}

                    <div
                        className = { itemClass }
                        onClick = { muteEveryoneElse }>
                        <Icon
                            size = { 20 }
                            src = { IconMuteEveryoneElse } />
                        <span>{t('toolbar.accessibilityLabel.muteEveryoneElse')}</span>
                    </div>
                </>
                )}

                {isLocalModerator && (isParticipantVideoMuted || (
                    <div
                        className = { itemClass }
                        onClick = { muteVideo }>
                        <Icon
                            size = { 20 }
                            src = { IconVideoOff } />
                        <span>{t('participantsPane.actions.stopVideo')}</span>
                    </div>
                ))}
            </div>

            <div className = { classes.group }>
                {isLocalModerator && (
                <>
                    {!isParticipantModerator(participant)
                     && <div
                         className = { itemClass }
                         onClick = { grantModerator }>
                         <Icon
                             size = { 20 }
                             src = { IconCrown } />
                         <span>{t('toolbar.accessibilityLabel.grantModerator')}</span>
                     </div>}
                    <div
                        className = { itemClass }
                        onClick = { kick }>
                        <Icon
                            size = { 20 }
                            src = { IconCloseCircle } />
                        <span>{t('videothumbnail.kick')}</span>
                    </div>
                </>
                )}
                {isChatButtonEnabled && (
                    <div
                        className = { itemClass }
                        onClick = { sendPrivateMessage }>
                        <Icon
                            size = { 20 }
                            src = { IconMessage } />
                        <span>{t('toolbar.accessibilityLabel.privateMessage')}</span>
                    </div>
                )}
            </div>
          </>
    );
};
