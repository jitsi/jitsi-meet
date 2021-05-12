// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { requestDisableModeration, requestEnableModeration } from '../../av-moderation/actions';
import { isEnabled as isAvModerationEnabled } from '../../av-moderation/functions';
import { IconMicrophoneEmpty, IconMicrophoneEmptySlash } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import theme from '../theme.json';

import {
    ContextMenu,
    ContextMenuIcon,
    ContextMenuItem
} from './styled';

const StyledContextMenu = styled(ContextMenu)`
    bottom: auto;
    margin: 0;
    right: 0;
    top: -8px;
    transform: translateY(-100%);
    width: 283px;
`;

type Props = {

  /**
   * Callback for the mouse leaving this item
   */
  onMouseLeave: Function
};

export const FooterContextMenu = ({ onMouseLeave }: Props) => {
    const dispatch = useDispatch();
    const isModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const { t } = useTranslation();

    const disable = useCallback(() => dispatch(requestDisableModeration(MEDIA_TYPE.AUDIO)), [ dispatch ]);

    const enable = useCallback(() => dispatch(requestEnableModeration(MEDIA_TYPE.AUDIO)), [ dispatch ]);

    return (
        <StyledContextMenu onMouseLeave = { onMouseLeave }>
            { isModerationEnabled ? (
                <ContextMenuItem
                    id = 'participants-pane-context-menu-stop-moderation'
                    onClick = { disable }>
                    <ContextMenuIcon src = { IconMicrophoneEmpty } />
                    <span>{ t('participantsPane.actions.stopModeration') }</span>
                </ContextMenuItem>
            ) : (
                <ContextMenuItem
                    id = 'participants-pane-context-menu-start-moderation'
                    onClick = { enable }>
                    <ContextMenuIcon
                        color = { theme.colors.moderationDisabled }
                        src = { IconMicrophoneEmptySlash } />
                    <span>{ t('participantsPane.actions.startModeration') }</span>
                </ContextMenuItem>
            )}
        </StyledContextMenu>
    );
};
