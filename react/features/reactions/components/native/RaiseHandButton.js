// @flow

import React, { Component } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';
import { type Dispatch } from 'redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import {
    getLocalParticipant,
    hasRaisedHand,
    raiseHand
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { type AbstractButtonProps } from '../../../base/toolbox/components';

import { type ReactionStyles } from './ReactionButton';

/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The local participant.
     */
    _localParticipant: Object,

    /**
     * Whether the participant raused their hand or not.
     */
    _raisedHand: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Used to close the overflow menu after raise hand is clicked.
     */
    onCancel: Function,

    /**
     * Styles for the button.
     */
    _styles: ReactionStyles
};

/**
 * An implementation of a button to raise or lower hand.
 */
class RaiseHandButton extends Component<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    label = 'toolbar.raiseYourHand';
    toggledLabel = 'toolbar.lowerYourHand';

    /**
     * Initializes a new {@code RaiseHandButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code RaiseHandButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._toggleRaisedHand = this._toggleRaisedHand.bind(this);
        this._getLabel = this._getLabel.bind(this);
    }

    _onClick: () => void;

    _toggleRaisedHand: () => void;

    _getLabel: () => string;

    /**
     * Handles clicking / pressing the button.
     *
     * @returns {void}
     */
    _onClick() {
        this._toggleRaisedHand();
        this.props.onCancel();
    }

    /**
     * Toggles the rased hand status of the local participant.
     *
     * @returns {void}
     */
    _toggleRaisedHand() {
        const enable = !this.props._raisedHand;

        sendAnalytics(createToolbarEvent('raise.hand', { enable }));

        this.props.dispatch(raiseHand(enable));
    }

    /**
     * Gets the current label, taking the toggled state into account. If no
     * toggled label is provided, the regular label will also be used in the
     * toggled state.
     *
     * @returns {string}
     */
    _getLabel() {
        const { _raisedHand, t } = this.props;

        return t(_raisedHand ? this.toggledLabel : this.label);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _styles, t } = this.props;

        return (
            <TouchableHighlight
                accessibilityLabel = { t(this.accessibilityLabel) }
                accessibilityRole = 'button'
                onPress = { this._onClick }
                style = { _styles.style }
                underlayColor = { _styles.underlayColor }>
                <View style = { _styles.container }>
                    <Text style = { _styles.emoji }>✋</Text>
                    <Text style = { _styles.text }>{this._getLabel()}</Text>
                </View>
            </TouchableHighlight>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const _localParticipant = getLocalParticipant(state);

    return {
        _localParticipant,
        _raisedHand: hasRaisedHand(_localParticipant),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox').raiseHandButton
    };
}

export default translate(connect(_mapStateToProps)(RaiseHandButton));
