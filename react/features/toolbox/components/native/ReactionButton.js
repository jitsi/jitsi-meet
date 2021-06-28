// @flow

import React, { Component } from 'react';
import { Text, TouchableHighlight } from 'react-native';
import { type Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import type { StyleType } from '../../../base/styles';
import { sendReaction } from '../../../chat/actions.any';
import { REACTIONS } from '../../constants';


export type ReactionStyles = {

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
     * Collection of styles for the button.
     */
    styles: ReactionStyles,

    /**
     * The reaction to be sent
     */
    reaction: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * An implementation of a button to send a reaction.
 */
class ReactionButton extends Component<Props, *> {
    /**
     * Initializes a new {@code ReactionButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code ReactionButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._sendReaction = this._sendReaction.bind(this);
    }

    _onClick: () => void;

    _sendReaction: () => void;

    /**
     * Handles clicking / pressing the button.
     *
     * @returns {void}
     */
    _onClick() {
        this._sendReaction();
    }

    /**
     * Send reaction.
     *
     * @returns {void}
     */
    _sendReaction() {
        this.props.dispatch(sendReaction(this.props.reaction));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { styles, reaction, t } = this.props;

        return (
            <TouchableHighlight
                accessibilityLabel = { t(`toolbar.accessibilityLabel.${reaction}`) }
                accessibilityRole = 'button'
                onPress = { this._onClick }
                style = { styles.style }
                underlayColor = { styles.underlayColor }>
                <Text style = { styles.emoji }>{REACTIONS[reaction].emoji}</Text>
            </TouchableHighlight>
        );
    }
}

export default translate(connect(null)(ReactionButton));
