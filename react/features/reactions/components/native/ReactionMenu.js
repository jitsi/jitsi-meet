// @flow

import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { getParticipantCount } from '../../../base/participants';
import { REACTIONS } from '../../constants';

import RaiseHandButton from './RaiseHandButton';
import ReactionButton from './ReactionButton';

/**
 * The type of the React {@code Component} props of {@link ReactionMenu}.
 */
type Props = {

    /**
     * Used to close the overflow menu after raise hand is clicked.
     */
    onCancel: Function,

    /**
     * Whether or not it's displayed in the overflow menu.
     */
    overflowMenu: boolean
};

/**
 * Animated reaction emoji.
 *
 * @returns {ReactElement}
 */
function ReactionMenu({
    onCancel,
    overflowMenu
}: Props) {
    const _styles = useSelector(state => ColorSchemeRegistry.get(state, 'Toolbox'));
    const _participantCount = useSelector(state => getParticipantCount(state));

    return (
        <View style = { overflowMenu ? _styles.overflowReactionMenu : _styles.reactionMenu }>
            {_participantCount > 1
                && <View style = { _styles.reactionRow }>
                    {Object.keys(REACTIONS).map(key => (
                        <ReactionButton
                            key = { key }
                            reaction = { key }
                            styles = { _styles.reactionButton } />
                    ))}
                </View>
            }
            <RaiseHandButton onCancel = { onCancel } />
        </View>
    );
}

export default ReactionMenu;
