// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { ToolbarButton } from '../../../toolbox';
import { ColorPalette } from '../../../base/styles';
import { Avatar } from '../../../base/participants';

import {
    incomingCallAnswered,
    incomingCallDeclined
} from '../actions';

import styles, { CALLER_AVATAR_SIZE } from './styles';

type Props = {
    _callerName: string,
    _callerAvatarUrl: string,
    _onAnswered: Function,
    _onDeclined: Function,
    t: Function
};

/**
 * The React {@code Component} displays an incoming call screen.
 */
class IncomingCallPage extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, _callerName } = this.props;

        return (
            <View style = { styles.pageContainer }>
                <Text style = { styles.title }>
                    { t('incomingCall.title') }
                </Text>
                <Text style = { styles.callerName }>
                    { _callerName }
                </Text>
                { this._renderCallerAvatar() }
                { this._renderButtons() }
            </View>
        );
    }

    /**
     * Renders caller avatar.
     *
     * @private
     * @returns {React$Node}
     */
    _renderCallerAvatar() {
        return (
            <View style = { styles.avatar }>
                <Avatar
                    size = { CALLER_AVATAR_SIZE }
                    uri = { this.props._callerAvatarUrl } />
            </View>
        );
    }

    /**
     * Renders buttons.
     *
     * @private
     * @returns {React$Node}
     */
    _renderButtons() {
        const { t, _onAnswered, _onDeclined } = this.props;

        return (
            <View style = { styles.buttonContainer }>
                <View>
                    <ToolbarButton
                        accessibilityLabel = 'Decline'
                        iconName = 'hangup'
                        iconStyle = { styles.buttonIcon }
                        onClick = { _onDeclined }
                        style = { styles.declineButton }
                        underlayColor = { ColorPalette.buttonUnderlay } />
                    <Text style = { styles.buttonText }>
                        { t('incomingCall.decline') }
                    </Text>
                </View>
                <View>
                    <ToolbarButton
                        accessibilityLabel = 'Answer'
                        iconName = 'hangup'
                        iconStyle = { styles.buttonIcon }
                        onClick = { _onAnswered }
                        style = { styles.answerButton }
                        underlayColor = { ColorPalette.buttonUnderlay } />
                    <Text style = { styles.buttonText }>
                        { t('incomingCall.answer') }
                    </Text>
                </View>
            </View>
        );
    }
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _onAnswered: Function,
 *     _onDeclined: Function
 * }}
 */
function _mapDispatchToProps(dispatch: Dispatch<*>) {
    return {
        /**
         * Dispatches an action to answer an incoming call.
         *
         * @private
         * @returns {void}
         */
        _onAnswered() {
            dispatch(incomingCallAnswered());
        },

        /**
         * Dispatches an action to decline an incoming call.
         *
         * @private
         * @returns {void}
         */
        _onDeclined() {
            dispatch(incomingCallDeclined());
        }

    };
}

/**
 * Maps (parts of) the redux state to the component's props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _callerName: string,
 *     _callerAvatarUrl: string
 * }}
 */
function _mapStateToProps(state) {
    const { caller } = state['features/mobile/incoming-call'] || {};

    return (caller && {
        /**
         * The caller's name.
         *
         * @private
         * @type {string}
         */
        _callerName: caller.name,

        /**
         * The caller's avatar url.
         *
         * @private
         * @type {string}
         */
        _callerAvatarUrl: caller.avatarUrl

    }) || {};
}

export default translate(
    connect(_mapStateToProps, _mapDispatchToProps)(IncomingCallPage));
