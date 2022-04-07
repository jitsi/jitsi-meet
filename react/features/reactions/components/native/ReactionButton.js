// @flow

import React, { useCallback } from 'react';
import { Text, TouchableHighlight } from 'react-native';
import { useDispatch } from 'react-redux';

import { createReactionMenuEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import type { StyleType } from '../../../base/styles';
import { addReactionToBuffer } from '../../actions.any';
import { REACTIONS } from '../../constants';


export type ReactionStyles = {

    /**
     * Style for the gif button.
     */
    gifButton: StyleType,

    /**
     * Style for the button.
     */
    style: StyleType,

    /**
     * Underlay color for the button.
     */
    underlayColor: StyleType,

    /**
     * Style for the emoji text on the button.
     */
    emoji: StyleType,

    /**
     * Style for the label text on the button.
     */
    text?: StyleType,

    /**
     * Style for text container. Used on raise hand button.
     */
    container?: StyleType

}

/**
 * The type of the React {@code Component} props of {@link ReactionButton}.
 */
type Props = {

    /**
     * Component children.
     */
    children?: ReactNode,

    /**
     * External click handler.
     */
    onClick?: Function,

    /**
     * Collection of styles for the button.
     */
    styles: ReactionStyles,

    /**
     * The reaction to be sent.
     */
    reaction: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * An implementation of a button to send a reaction.
 *
 * @returns {ReactElement}
 */
function ReactionButton({
    children,
    onClick,
    styles,
    reaction,
    t
}: Props) {
    const dispatch = useDispatch();
    const _onClick = useCallback(() => {
        dispatch(addReactionToBuffer(reaction));
        sendAnalytics(createReactionMenuEvent(reaction));
    }, [ reaction ]);

    return (
        <TouchableHighlight
            accessibilityLabel = { t(`toolbar.accessibilityLabel.${reaction}`) }
            accessibilityRole = 'button'
            onPress = { onClick || _onClick }
            style = { [ styles.style, children && styles?.gifButton ] }
            underlayColor = { styles.underlayColor }>
            {children ?? <Text style = { styles.emoji }>{REACTIONS[reaction].emoji}</Text>}
        </TouchableHighlight>
    );
}

export default translate(ReactionButton);
