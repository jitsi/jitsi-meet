/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// @ts-ignore
import { openDialog, openSheet } from '../../../base/dialog';
import { IconHorizontalPoints } from '../../../base/icons/svg/index';
import IconButton from '../../../base/react/components/native/IconButton';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import MuteEveryoneDialog
// @ts-ignore
    from '../../../video-menu/components/native/MuteEveryoneDialog';
// @ts-ignore
import { isMoreActionsVisible, isMuteAllVisible } from '../../functions';

// @ts-ignore
import { ContextMenuMore } from './ContextMenuMore';
// @ts-ignore
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
        <View style = { styles.participantsPaneFooter }>
            {
                showMuteAll && (
                    <Button
                        accessibilityLabel = 'participantsPane.actions.muteAll'
                        label = 'participantsPane.actions.muteAll'
                        onPress = { muteAll }
                        type = { BUTTON_TYPES.SECONDARY } />
                )
            }
            {
                showMoreActions && (
                    <IconButton
                        onPress = { openMoreMenu }
                        src = { IconHorizontalPoints }
                        style = { styles.moreButton }
                        type = { BUTTON_TYPES.SECONDARY } />
                )
            }
        </View>
    );
};

export default ParticipantsPaneFooter;
