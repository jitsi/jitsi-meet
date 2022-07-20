// @flow

import React from 'react';
import { Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { _abstractMapStateToProps } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { StyleType } from '../../../../base/styles';
import AbstractStreamKeyForm, {
    type Props as AbstractProps
} from '../AbstractStreamKeyForm';
import { getLiveStreaming } from '../functions';

import styles, { PLACEHOLDER_COLOR } from './styles';

type Props = AbstractProps & {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: StyleType
};

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @augments Component
 */
class StreamKeyForm extends AbstractStreamKeyForm<Props> {
    /**
     * Initializes a new {@code StreamKeyForm} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyForm} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onOpenGooglePrivacyPolicy = this._onOpenGooglePrivacyPolicy.bind(this);
        this._onOpenHelp = this._onOpenHelp.bind(this);
        this._onOpenYoutubeTerms = this._onOpenYoutubeTerms.bind(this);

    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialogStyles, t } = this.props;

        return (
            <View style = { styles.formWrapper }>
                <Text
                    style = { [
                        _dialogStyles.text,
                        styles.text,
                        styles.streamKeyInputLabel
                    ] }>
                    {
                        t('dialog.streamKey')
                    }
                </Text>
                <TextInput
                    onChangeText = { this._onInputChange }
                    placeholder = { t('liveStreaming.enterStreamKey') }
                    placeholderTextColor = { PLACEHOLDER_COLOR }
                    selectionColor = { PLACEHOLDER_COLOR }
                    style = { [
                        _dialogStyles.text,
                        styles.streamKeyInput
                    ] }
                    value = { this.props.value } />
                <View style = { styles.formFooter }>
                    {
                        this.state.showValidationError
                            ? <View style = { styles.formFooterItem }>
                                <Text
                                    style = { [
                                        _dialogStyles.text,
                                        styles.warningText
                                    ] }>
                                    { t('liveStreaming.invalidStreamKey') }
                                </Text>
                            </View>
                            : null
                    }
                    <View style = { styles.formFooterItem }>
                        <TouchableOpacity
                            onPress = { this._onOpenHelp }
                            style = { styles.streamKeyHelp } >
                            <Text
                                style = { [
                                    _dialogStyles.text,
                                    styles.text
                                ] }>
                                {
                                    t('liveStreaming.streamIdHelp')
                                }
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View>
                    <TouchableOpacity onPress = { this._onOpenYoutubeTerms }>
                        <Text
                            style = { [
                                _dialogStyles.text,
                                styles.text,
                                styles.tcText
                            ] }>
                            {
                                t('liveStreaming.youtubeTerms')
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
                <View>
                    <TouchableOpacity onPress = { this._onOpenGooglePrivacyPolicy }>
                        <Text
                            style = { [
                                _dialogStyles.text,
                                styles.text,
                                styles.tcText
                            ] }>
                            {
                                t('liveStreaming.googlePrivacyPolicy')
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    _onInputChange: Object => void;

    _onOpenGooglePrivacyPolicy: () => void;

    /**
     * Opens the Google Privacy Policy web page.
     *
     * @private
     * @returns {void}
     */
    _onOpenGooglePrivacyPolicy() {
        Linking.openURL(this.props._liveStreaming.dataPrivacyURL);
    }

    _onOpenHelp: () => void;

    /**
     * Opens the information link on how to manually locate a YouTube broadcast
     * stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        const helpURL = this.props._liveStreaming.helpURL;

        if (typeof helpURL === 'string') {
            Linking.openURL(helpURL);
        }
    }

    _onOpenYoutubeTerms: () => void;

    /**
     * Opens the YouTube terms and conditions web page.
     *
     * @private
     * @returns {void}
     */
    _onOpenYoutubeTerms() {
        Linking.openURL(this.props._liveStreaming.termsURL);
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code StreamKeyForm} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *    _liveStreaming: LiveStreamingProps
 * }}
 */
function _mapStateToProps(state: Object) {
    return {
        ..._abstractMapStateToProps(state),
        _liveStreaming: getLiveStreaming(state)
    };
}

export default translate(connect(_mapStateToProps)(StreamKeyForm));
