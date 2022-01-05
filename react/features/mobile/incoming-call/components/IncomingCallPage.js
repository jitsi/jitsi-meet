// @flow

import React, { Component } from 'react';
import { Image, Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import AnswerButton from './AnswerButton';
import DeclineButton from './DeclineButton';
import styles, { CALLER_AVATAR_SIZE } from './styles';

/**
 * The type of React {@code Component} props of {@link IncomingCallPage}.
 */
type Props = {

    /**
     * Caller's avatar URL.
     */
    _callerAvatarURL: string,

    /**
     * Caller's name.
     */
    _callerName: string,

    /**
     * Whether the call has video or not.
     */
    _hasVideo: boolean,

    /**
     * Helper for translating strings.
     */
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
                        source = {{ uri: this.props._callerAvatarURL }}
                        style = { styles.backgroundAvatarImage } />
                </View>
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
     * Renders buttons.
     *
     * @private
     * @returns {React$Node}
     */
    _renderButtons() {
        const { t } = this.props;

        return (
            <View style = { styles.buttonsContainer }>
                <View style = { styles.buttonWrapper } >
                    <DeclineButton
                        styles = { styles.declineButtonStyles } />
                    <Text style = { styles.buttonText }>
                        { t('incomingCall.decline') }
                    </Text>
                </View>
                <View style = { styles.buttonWrapper }>
                    <AnswerButton
                        styles = { styles.answerButtonStyles } />
                    <Text style = { styles.buttonText }>
                        { t('incomingCall.answer') }
                    </Text>
                </View>
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
                <View style = { styles.avatar }>
                    <Avatar
                        size = { CALLER_AVATAR_SIZE }
                        url = { this.props._callerAvatarURL } />
                </View>
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to the component's props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _callerAvatarURL: string,
 *     _callerName: string,
 *     _hasVideo: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { caller } = state['features/mobile/incoming-call'] || {};

    return {
        /**
         * The caller's avatar url.
         *
         * @private
         * @type {string}
         */
        _callerAvatarURL: caller.avatarUrl,

        /**
         * The caller's name.
         *
         * @private
         * @type {string}
         */
        _callerName: caller.name,

        /**
         * Whether the call has video or not.
         *
         * @private
         * @type {boolean}
         */
        _hasVideo: caller.hasVideo
    };
}

export default translate(connect(_mapStateToProps)(IncomingCallPage));
