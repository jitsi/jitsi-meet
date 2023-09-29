import React, { useCallback } from 'react';
import { Image, View } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { isGifEnabled } from '../../../gifs/functions.native';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { REACTIONS } from '../../constants';

import RaiseHandButton from './RaiseHandButton';
import ReactionButton from './ReactionButton';

/**
 * The type of the React {@code Component} props of {@link ReactionMenu}.
 */
interface IProps {

    /**
     * Used to close the overflow menu after raise hand is clicked.
     */
    onCancel: Function;

    /**
     * Whether or not it's displayed in the overflow menu.
     */
    overflowMenu: boolean;
}

/**
 * Animated reaction emoji.
 *
 * @returns {ReactElement}
 */
function ReactionMenu({
    onCancel,
    overflowMenu
}: IProps) {
    const _styles: any = useSelector((state: IReduxState) => ColorSchemeRegistry.get(state, 'Toolbox'));
    const gifEnabled = useSelector(isGifEnabled);

    const openGifMenu = useCallback(() => {
        navigate(screen.conference.gifsMenu);
        onCancel();
    }, []);

    return (
        <View style = { overflowMenu ? _styles.overflowReactionMenu : _styles.reactionMenu }>
            <View style = { _styles.reactionRow }>
                {
                    Object.keys(REACTIONS).map(key => (
                        <ReactionButton
                            key = { key }
                            reaction = { key }
                            styles = { _styles.reactionButton } />
                    ))
                }
                {
                    gifEnabled && (
                        <ReactionButton
                            onClick = { openGifMenu }
                            styles = { _styles.reactionButton }>
                            <Image // @ts-ignore
                                height = { 22 }
                                source = { require('../../../../../images/GIPHY_icon.png') } />
                        </ReactionButton>
                    )
                }
            </View>
            <RaiseHandButton onCancel = { onCancel } />
        </View>
    );
}

export default ReactionMenu;
