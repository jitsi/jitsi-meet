// @flow

import React, { useCallback } from 'react';
import { Image, View } from 'react-native';
import { useSelector } from 'react-redux';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { isGifEnabled } from '../../../gifs/functions';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
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
    const gifEnabled = useSelector(isGifEnabled);

    const openGifMenu = useCallback(() => {
        navigate(screen.conference.gifsMenu);
        onCancel();
    }, []);

    return (
        <View style = { overflowMenu ? _styles.overflowReactionMenu : _styles.reactionMenu }>
            <View style = { _styles.reactionRow }>
                {Object.keys(REACTIONS).map(key => (
                    <ReactionButton
                        key = { key }
                        reaction = { key }
                        styles = { _styles.reactionButton } />
                ))}
                {gifEnabled && (
                    <ReactionButton
                        onClick = { openGifMenu }
                        styles = { _styles.reactionButton }>
                        <Image
                            height = { 22 }
                            source = { require('../../../../../images/GIPHY_icon.png') } />
                    </ReactionButton>
                )}
            </View>
            <RaiseHandButton onCancel = { onCancel } />
        </View>
    );
}

export default ReactionMenu;
