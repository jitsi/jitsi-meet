import React from 'react';
import { Linking, Text, View } from 'react-native';

import { _abstractMapStateToProps } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { StyleType } from '../../../../base/styles';
import Button from '../../../../base/ui/components/native/Button';
import Input from '../../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
import AbstractStreamKeyForm, {
    type Props as AbstractProps
} from '../AbstractStreamKeyForm';
import { getLiveStreaming } from '../functions';


import styles from './styles';

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
            <>
                <View style = { styles.formWrapper }>
                    <Input
                        customStyles = {{ input: styles.streamKeyInput }}
                        onChange = { this._onInputChange }
                        placeholder = { t('liveStreaming.enterStreamKey') }
                        value = { this.props.value } />
                    <View style = { styles.formValidation }>
                        {
                            this.state.showValidationError
                                ? <View style = { styles.formValidationItem }>
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

                    </View>
                </View>
                <View style = { styles.formButtonsWrapper }>
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
