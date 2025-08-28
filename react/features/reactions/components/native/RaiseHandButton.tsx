import React, { Component } from 'react';
import { Text } from 'react-native-paper';
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { RAISE_HAND_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { raiseHand } from '../../../base/participants/actions';
import {
    getLocalParticipant,
    hasRaisedHand
} from '../../../base/participants/functions';
import { ILocalParticipant } from '../../../base/participants/types';
import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether this button is enabled or not.
     */
    _enabled: boolean;

    /**
     * The local participant.
     */
    _localParticipant?: ILocalParticipant;

    /**
     * Whether the participant raused their hand or not.
     */
    _raisedHand: boolean;

    /**
     * Whether or not the click is disabled.
     */
    disableClick?: boolean;

    /**
     * Used to close the overflow menu after raise hand is clicked.
     */
    onCancel: Function;
}

/**
 * An implementation of a button to raise or lower hand.
 */
class RaiseHandButton extends Component<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    label = 'toolbar.raiseYourHand';
    toggledLabel = 'toolbar.lowerYourHand';

    /**
     * Initializes a new {@code RaiseHandButton} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code RaiseHandButton} instance with.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._toggleRaisedHand = this._toggleRaisedHand.bind(this);
        this._getLabel = this._getLabel.bind(this);
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @returns {void}
     */
    _onClick() {
        const { disableClick, onCancel } = this.props;

        if (disableClick) {
            return;
        }

        this._toggleRaisedHand();
        onCancel();
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
     * Renders the "raise hand" emoji.
     *
     * @returns {ReactElement}
     */
    _renderRaiseHandEmoji() {
        return (
            <Text>✋</Text>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { _enabled } = this.props;

        if (!_enabled) {
            return null;
        }

        return (
            <Button
                accessibilityLabel = { this.accessibilityLabel }
                icon = { this._renderRaiseHandEmoji }
                labelKey = { this._getLabel() }
                onClick = { this._onClick }
                style = { styles.raiseHandButton }
                type = { BUTTON_TYPES.SECONDARY } />
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const _localParticipant = getLocalParticipant(state);
    const enabled = getFeatureFlag(state, RAISE_HAND_ENABLED, true);

    return {
        _enabled: enabled,
        _localParticipant,
        _raisedHand: hasRaisedHand(_localParticipant)
    };
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _standaloneMapStateToProps(state: IReduxState) {
    const _enabled = getFeatureFlag(state, RAISE_HAND_ENABLED, true);

    return {
        _enabled
    };
}

const StandaloneRaiseHandButton = translate(connect(_standaloneMapStateToProps)(RaiseHandButton));

export { StandaloneRaiseHandButton };

export default translate(connect(_mapStateToProps)(RaiseHandButton));
