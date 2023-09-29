import React, { useCallback } from 'react';
import { View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog, openSheet } from '../../../base/dialog/actions';
import { IconDotsHorizontal } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import MuteEveryoneDialog from '../../../video-menu/components/native/MuteEveryoneDialog';
import { isMoreActionsVisible, isMuteAllVisible } from '../../functions';

import { ContextMenuMore } from './ContextMenuMore';
import styles from './styles';


/**
 * Implements the participants pane footer component.
 *
 * @returns { JSX.Element} - The participants pane footer component.
 */
const ParticipantsPaneFooter = (): JSX.Element => {
    const dispatch = useDispatch();
    const openMoreMenu = useCallback(() => dispatch(openSheet(ContextMenuMore)), [ dispatch ]);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)),
        [ dispatch ]);
    const showMoreActions = useSelector(isMoreActionsVisible);
    const showMuteAll = useSelector(isMuteAllVisible);

    return (
        <View style = { styles.participantsPaneFooter as ViewStyle }>
            {
                showMuteAll && (
                    <Button
                        accessibilityLabel = 'participantsPane.actions.muteAll'
                        labelKey = 'participantsPane.actions.muteAll'
                        onClick = { muteAll }
                        type = { BUTTON_TYPES.SECONDARY } />
                )
            }
            {
                showMoreActions && (
                    <IconButton
                        onPress = { openMoreMenu }
                        src = { IconDotsHorizontal }
                        style = { styles.moreButton }
                        type = { BUTTON_TYPES.SECONDARY } />
                )
            }
        </View>
    );
};

export default ParticipantsPaneFooter;
