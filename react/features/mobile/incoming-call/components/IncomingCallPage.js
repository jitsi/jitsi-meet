// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import {
    incomingCallAnswered,
    incomingCallDeclined
} from '../actions';

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
        const { t } = this.props;

        return ( // TODO: layout and styles
            <View>
                <Text>{ this.props._callerName }</Text>
                <Text onPress = { this.props._onAnswered }>
                    { t('incomingCall.answer') }
                </Text>
                <Text onPress = { this.props._onDeclined }>
                    { t('incomingCall.decline') }
                </Text>
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
function _mapDispatchToProps(dispatch) {
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
