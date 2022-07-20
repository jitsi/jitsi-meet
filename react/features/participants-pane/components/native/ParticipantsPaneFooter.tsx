/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// @ts-ignore
import { openSheet } from '../../../base/dialog';
import Button from '../../../base/react/components/native/Button';
// @ts-ignore
import { BUTTON_TYPES } from '../../../base/react/constants';
// @ts-ignore
import { isMoreActionsVisible } from '../../functions';

// @ts-ignore
import { ModeratorMenu } from './ModeratorMenu';
// @ts-ignore
import styles from './styles';


/**
 * Implements the participants pane footer component.
 *
 * @returns { JSX.Element} - The participants pane footer component.
 */
const ParticipantsPaneFooter = (): JSX.Element|null => {
    const dispatch = useDispatch();
    const openMenu = useCallback(() => dispatch(openSheet(ModeratorMenu)), [ dispatch ]);
    const showMoreActions = useSelector(isMoreActionsVisible);

    if (!showMoreActions) {
        return null;
    }

    return (
        <View style = { styles.participantsPaneFooter }>
            <Button
                accessibilityLabel = 'participantsPane.actions.moderator'
                label = 'participantsPane.actions.moderator'
                onPress = { openMenu }
                style = { styles.moreButton }
                type = { BUTTON_TYPES.SECONDARY } />
        </View>
    );
};

export default ParticipantsPaneFooter;
