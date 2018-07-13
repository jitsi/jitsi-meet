// @flow

import React, { Component } from 'react';
import { Image, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { Avatar } from '../../../base/participants';

import {
    incomingCallAnswered,
    incomingCallDeclined
} from '../actions';
import styles, {
    AVATAR_BORDER_GRADIENT,
    BACKGROUND_OVERLAY_GRADIENT,
    CALLER_AVATAR_SIZE
} from './styles';
import AnswerButton from './AnswerButton';
import DeclineButton from './DeclineButton';


type Props = {
    _callerName: string,
    _callerAvatarUrl: string,
    _hasVideo: boolean,
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
        const { t, _callerName, _hasVideo } = this.props;
        const callTitle
            = _hasVideo
                ? t('incomingCall.videoCallTitle')
                : t('incomingCall.audioCallTitle');

        return (
            <View style = { styles.pageContainer }>
                <View style = { styles.backgroundAvatar }>
                    <Image
                        source = {{ uri: this.props._callerAvatarUrl }}
                        style = { styles.backgroundAvatarImage } />
                </View>
                <LinearGradient
                    colors = { BACKGROUND_OVERLAY_GRADIENT }
                    style = { styles.backgroundOverlayGradient } />
                <Text style = { styles.title }>
                    { callTitle }
                </Text>
                <Text
                    numberOfLines = { 6 }
                    style = { styles.callerName } >
                    { _callerName }
                </Text>
                <Text style = { styles.productLabel }>
                    { t('incomingCall.productLabel') }
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
            <View style = { styles.avatarContainer }>
                <LinearGradient
                    colors = { AVATAR_BORDER_GRADIENT }
                    style = { styles.avatarBorder } />
                <View style = { styles.avatar }>
                    <Avatar
                        size = { CALLER_AVATAR_SIZE }
                        uri = { this.props._callerAvatarUrl } />
                </View>
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
            <View style = { styles.buttonsContainer }>
                <View style = { styles.buttonWrapper } >
                    <DeclineButton
                        onClick = { _onDeclined }
                        styles = { styles.declineButtonStyles } />
                    <Text style = { styles.buttonText }>
                        { t('incomingCall.decline') }
                    </Text>
                </View>
                <View style = { styles.buttonWrapper }>
                    <AnswerButton
                        onClick = { _onAnswered }
                        styles = { styles.answerButtonStyles } />
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
        _callerAvatarUrl: caller.avatarUrl,

        /**
         * Indicates if it's an audio or a video call.
         */
        _hasVideo: caller.hasVideo

    }) || {};
}

export default translate(
    connect(_mapStateToProps, _mapDispatchToProps)(IncomingCallPage));
