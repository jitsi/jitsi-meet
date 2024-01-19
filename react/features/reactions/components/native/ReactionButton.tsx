import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { ColorValue, GestureResponderEvent, Text, TouchableHighlight, ViewStyle } from 'react-native';
import { useDispatch } from 'react-redux';

import { createReactionMenuEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { translate } from '../../../base/i18n/functions';
import { StyleType } from '../../../base/styles/functions.native';
import { addReactionToBuffer } from '../../actions.any';
import { REACTIONS } from '../../constants';

interface IReactionStyles {

    /**
     * Style for text container. Used on raise hand button.
     */
    container?: StyleType;

    /**
     * Style for the emoji text on the button.
     */
    emoji: StyleType;

    /**
     * Style for the gif button.
     */
    gifButton: StyleType;

    /**
     * Style for the button.
     */
    style: StyleType;

    /**
     * Style for the label text on the button.
     */
    text?: StyleType;

    /**
     * Underlay color for the button.
     */
    underlayColor: ColorValue;

}

/**
 * The type of the React {@code Component} props of {@link ReactionButton}.
 */
interface IProps extends WithTranslation {

    /**
     * Component children.
     */
    children?: React.ReactNode;

    /**
     * External click handler.
     */
    onClick?: (e?: GestureResponderEvent) => void;

    /**
     * The reaction to be sent.
     */
    reaction?: string;

    /**
     * Collection of styles for the button.
     */
    styles: IReactionStyles;
}

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
}: IProps) {
    const dispatch = useDispatch();
    const _onClick = useCallback(() => {
        if (reaction) {
            dispatch(addReactionToBuffer(reaction));
            sendAnalytics(createReactionMenuEvent(reaction));
        }
    }, [ reaction ]);

    return (
        <TouchableHighlight
            accessibilityLabel = { t(`toolbar.accessibilityLabel.${reaction}`) }
            accessibilityRole = 'button'
            onPress = { onClick || _onClick }
            style = { [ styles.style, children && styles?.gifButton ] as ViewStyle[] }
            underlayColor = { styles.underlayColor }>
            {children ?? <Text style = { styles.emoji }>{REACTIONS[reaction ?? ''].emoji}</Text>}
        </TouchableHighlight>
    );
}

export default translate(ReactionButton);
