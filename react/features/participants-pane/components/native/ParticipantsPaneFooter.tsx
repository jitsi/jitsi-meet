import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector} from "react-redux";

import { openDialog, openSheet } from '../../../base/dialog';
import { IconHorizontalPoints } from '../../../base/icons';
import Button from '../../../base/react/components/native/Button';
import IconButton from '../../../base/react/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/react/constants';
import MuteEveryoneDialog
    from '../../../video-menu/components/native/MuteEveryoneDialog';
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

    return(
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
    )
};

export default ParticipantsPaneFooter;
