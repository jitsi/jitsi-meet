// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { IconMicrophoneEmpty, IconMicrophoneEmptySlash } from '../../base/icons';
import { disableModeratedAudio, enableModeratedAudio } from '../../moderated-audio/actions';
import { getIsEnabled } from '../../moderated-audio/functions';
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

export const FooterContextMenu = ({
    onMouseLeave
}: Props) => {
    const dispatch = useDispatch();
    const isModerationEnabled = useSelector(getIsEnabled);
    const { t } = useTranslation();

    const disable = useCallback(() =>
        dispatch(disableModeratedAudio())
    , [ dispatch ]);

    const enable = useCallback(() =>
        dispatch(enableModeratedAudio())
    , [ dispatch ]);

    return (
        <StyledContextMenu onMouseLeave = { onMouseLeave }>
            { isModerationEnabled ? (
                <ContextMenuItem onClick = { disable }>
                    <ContextMenuIcon src = { IconMicrophoneEmpty } />
                    <span>{ t('participantsPane.actions.stopModeration') }</span>
                </ContextMenuItem>
            ) : (
                <ContextMenuItem onClick = { enable }>
                    <ContextMenuIcon
                        color = { theme.colors.moderationDisabled }
                        src = { IconMicrophoneEmptySlash } />
                    <span>{ t('participantsPane.actions.startModeration') }</span>
                </ContextMenuItem>
            )}
        </StyledContextMenu>
    );
};
