import React from 'react';
import { Linking, Text, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { _abstractMapStateToProps } from '../../../../base/dialog/functions';
import { translate } from '../../../../base/i18n/functions';
import Button from '../../../../base/ui/components/native/Button';
import Input from '../../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
import AbstractStreamKeyForm, {
    IProps as AbstractProps
} from '../AbstractStreamKeyForm';
import { getLiveStreaming } from '../functions';

import styles from './styles';

interface IProps extends AbstractProps {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: any;
}

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @augments Component
 */
class StreamKeyForm extends AbstractStreamKeyForm<IProps> {
    /**
     * Initializes a new {@code StreamKeyForm} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyForm} instance with.
     */
    constructor(props: IProps) {
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
    override render() {
        const { _dialogStyles, t } = this.props;

        return (
            <>
                <View style = { styles.formWrapper as ViewStyle }>
                    <Input
                        customStyles = {{
                            input: styles.streamKeyInput,
                            container: styles.streamKeyContainer }}
                        onChange = { this._onInputChange }
                        placeholder = { t('liveStreaming.enterStreamKey') }
                        value = { this.props.value } />
                    <View style = { styles.formValidationItem as ViewStyle }>
                        {
                            this.state.showValidationError && <Text
                                style = { [
                                    _dialogStyles.text,
                                    styles.warningText
                                ] }>
                                { t('liveStreaming.invalidStreamKey') }
                            </Text>
                        }
                    </View>
                </View>
                <View style = { styles.formButtonsWrapper as ViewStyle }>
                    <Button
                        accessibilityLabel = 'liveStreaming.streamIdHelp'
                        labelKey = 'liveStreaming.streamIdHelp'
                        labelStyle = { styles.buttonLabelStyle }
                        onClick = { this._onOpenHelp }
                        type = { BUTTON_TYPES.TERTIARY } />
                    <Button
                        accessibilityLabel = 'liveStreaming.youtubeTerms'
                        labelKey = 'liveStreaming.youtubeTerms'
                        labelStyle = { styles.buttonLabelStyle }
                        onClick = { this._onOpenYoutubeTerms }
                        type = { BUTTON_TYPES.TERTIARY } />
                    <Button
                        accessibilityLabel = 'liveStreaming.googlePrivacyPolicy'
                        labelKey = 'liveStreaming.googlePrivacyPolicy'
                        labelStyle = { styles.buttonLabelStyle }
                        onClick = { this._onOpenGooglePrivacyPolicy }
                        type = { BUTTON_TYPES.TERTIARY } />
                </View>
            </>
        );
    }

    /**
     * Opens the Google Privacy Policy web page.
     *
     * @private
     * @returns {void}
     */
    _onOpenGooglePrivacyPolicy() {
        const url = this.props._liveStreaming.dataPrivacyURL;

        if (typeof url === 'string') {
            Linking.openURL(url);
        }
    }

    /**
     * Opens the information link on how to manually locate a YouTube broadcast
     * stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        const url = this.props._liveStreaming.helpURL;

        if (typeof url === 'string') {
            Linking.openURL(url);
        }
    }

    /**
     * Opens the YouTube terms and conditions web page.
     *
     * @private
     * @returns {void}
     */
    _onOpenYoutubeTerms() {
        const url = this.props._liveStreaming.termsURL;

        if (typeof url === 'string') {
            Linking.openURL(url);
        }
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
function _mapStateToProps(state: IReduxState) {
    return {
        ..._abstractMapStateToProps(state),
        _liveStreaming: getLiveStreaming(state)
    };
}

export default translate(connect(_mapStateToProps)(StreamKeyForm));
