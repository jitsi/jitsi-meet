// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { requestDisableModeration, requestEnableModeration } from '../../av-moderation/actions';
import { isEnabled as isAvModerationEnabled } from '../../av-moderation/functions';
import { openDialog } from '../../base/dialog';
import { Icon, IconCheck, IconVideoOff } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import { getLocalParticipant } from '../../base/participants';
import { MuteEveryonesVideoDialog } from '../../video-menu/components';

import { useItemStyles } from './styled';

const useStyles = makeStyles(theme => {
    return {
        contextMenu: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius / 2,
            boxShadow: '0px 3px 16px rgba(0, 0, 0, 0.6), 0px 0px 4px 1px rgba(0, 0, 0, 0.25)',
            color: theme.palette.text01,
            padding: '8px 0',
            position: 'absolute',
            right: 0,
            top: -8,
            transform: 'translateY(-100%)',
            width: '238px'
        },
        drawerMenu: {
            backgroundColor: 'none',
            position: 'initial',
            transform: 'none',
            width: '100%'
        },
        text: {
            alignItems: 'center',
            display: 'flex',
            marginLeft: 52,
            lineHeight: '40px'
        },
        paddedAction: {
            marginLeft: 36
        }
    };
});

type Props = {

  /**
   * Callback for the mouse leaving this item
   */
  onMouseLeave?: Function
};

export const FooterContextMenu = ({ onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const { id } = useSelector(getLocalParticipant);
    const { t } = useTranslation();
    const disable = useCallback(() => dispatch(requestDisableModeration()), [ dispatch ]);
    const enable = useCallback(() => dispatch(requestEnableModeration()), [ dispatch ]);
    const classes = useStyles();
    const { itemClass } = useItemStyles();
    const muteAllVideo = useCallback(
        () => dispatch(openDialog(MuteEveryonesVideoDialog, { exclude: [ id ] })), [ dispatch ]);

    return (
        <div
            className = { clsx(classes.contextMenu, !onMouseLeave && classes.drawerMenu) }
            onMouseLeave = { onMouseLeave }>
            <div
                className = { itemClass }
                id = 'participants-pane-context-menu-stop-video'
                onClick = { muteAllVideo }>
                <Icon
                    size = { 20 }
                    src = { IconVideoOff } />
                <span>{ t('participantsPane.actions.stopEveryonesVideo') }</span>
            </div>

            <div className = { classes.text }>
                {t('participantsPane.actions.allow')}
            </div>
            { isModerationEnabled ? (
                <div
                    className = { itemClass }
                    id = 'participants-pane-context-menu-start-moderation'
                    onClick = { disable }>
                    <span className = { classes.paddedAction }>
                        { t('participantsPane.actions.startModeration') }
                    </span>
                </div>
            ) : (
                <div
                    className = { itemClass }
                    id = 'participants-pane-context-menu-stop-moderation'
                    onClick = { enable }>
                    <Icon
                        size = { 20 }
                        src = { IconCheck } />
                    <span>{ t('participantsPane.actions.startModeration') }</span>
                </div>
            )}
        </div>
    );
};
