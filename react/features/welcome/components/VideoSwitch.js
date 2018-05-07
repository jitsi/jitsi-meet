// @flow

import React, { Component } from 'react';
import { Switch, TouchableWithoutFeedback, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { updateProfile } from '../../base/profile';
import { Header, Text } from '../../base/react';

import styles, { SWITCH_THUMB_COLOR, SWITCH_UNDER_COLOR } from './styles';

/**
 * The type of the React {@code Component} props of {@link VideoSwitch}.
 */
type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The i18n translate function.
     */
    t: Function,

    /**
     * The current profile settings from redux.
     */
    _profile: Object
};

/**
 * Renders the "Video <-> Voice" switch on the {@code WelcomePage}.
 */
class VideoSwitch extends Component<Props> {
    /**
     * Initializes a new {@code VideoSwitch} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onStartAudioOnlyChange = this._onStartAudioOnlyChange.bind(this);
        this._onStartAudioOnlyFalse = this._onStartAudioOnlyChangeFn(false);
        this._onStartAudioOnlyTrue = this._onStartAudioOnlyChangeFn(true);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { t, _profile } = this.props;
        const { textStyle } = Header;

        return (
            <View style = { styles.audioVideoSwitchContainer }>
                <TouchableWithoutFeedback
                    onPress = { this._onStartAudioOnlyFalse }>
                    <Text style = { textStyle }>
                        { t('welcomepage.audioVideoSwitch.video') }
                    </Text>
                </TouchableWithoutFeedback>
                <Switch
                    onTintColor = { SWITCH_UNDER_COLOR }
                    onValueChange = { this._onStartAudioOnlyChange }
                    style = { styles.audioVideoSwitch }
                    thumbTintColor = { SWITCH_THUMB_COLOR }
                    value = { _profile.startAudioOnly } />
                <TouchableWithoutFeedback
                    onPress = { this._onStartAudioOnlyTrue }>
                    <Text style = { textStyle }>
                        { t('welcomepage.audioVideoSwitch.audio') }
                    </Text>
                </TouchableWithoutFeedback>
            </View>
        );
    }

    _onStartAudioOnlyChange: boolean => void;

    /**
     * Handles the audio-video switch changes.
     *
     * @private
     * @param {boolean} startAudioOnly - The new startAudioOnly value.
     * @returns {void}
     */
    _onStartAudioOnlyChange(startAudioOnly) {
        const { dispatch } = this.props;

        dispatch(updateProfile({
            ...this.props._profile,
            startAudioOnly
        }));
    }

    /**
     * Creates a function that forwards the {@code startAudioOnly} changes to
     * the function that handles it.
     *
     * @private
     * @param {boolean} startAudioOnly - The new {@code startAudioOnly} value.
     * @returns {void}
     */
    _onStartAudioOnlyChangeFn(startAudioOnly) {
        return () => this._onStartAudioOnlyChange(startAudioOnly);
    }

    _onStartAudioOnlyFalse: boolean => void;

    _onStartAudioOnlyTrue: boolean => void;
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code VideoSwitch}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     _profile: Object
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _profile: state['features/base/profile']
    };
}

export default translate(connect(_mapStateToProps)(VideoSwitch));
