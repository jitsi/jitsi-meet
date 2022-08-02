// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import AbstractStreamKeyForm, {
    type Props, _mapStateToProps
} from '../AbstractStreamKeyForm';

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
        this._onOpenHelp = this._onOpenHelp.bind(this);
        this._onOpenHelpKeyPress = this._onOpenHelpKeyPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, value } = this.props;

        return (
            <div className = 'stream-key-form'>
                <FieldTextStateless
                    autoFocus = { true }
                    compact = { true }
                    isSpellCheckEnabled = { false }
                    label = { t('dialog.streamKey') }
                    name = 'streamId'
                    okDisabled = { !value }
                    onChange = { this._onInputChange }
                    placeholder = { t('liveStreaming.enterStreamKey') }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.props.value } />
                <div className = 'form-footer'>
                    <div className = 'help-container'>
                        {
                            this.state.showValidationError
                                ? <span className = 'warning-text'>
                                    { t('liveStreaming.invalidStreamKey') }
                                </span>
                                : null
                        }
                        { this.props._liveStreaming.helpURL
                            ? <a
                                aria-label = { t('liveStreaming.streamIdHelp') }
                                className = 'helper-link'
                                onClick = { this._onOpenHelp }
                                onKeyPress = { this._onOpenHelpKeyPress }
                                role = 'link'
                                tabIndex = { 0 }>
                                { t('liveStreaming.streamIdHelp') }
                            </a>
                            : null
                        }
                    </div>
                    <a
                        className = 'helper-link'
                        href = { this.props._liveStreaming.termsURL }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.youtubeTerms') }
                    </a>
                    <a
                        className = 'helper-link'
                        href = { this.props._liveStreaming.dataPrivacyURL }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.googlePrivacyPolicy') }
                    </a>
                </div>
            </div>
        );
    }

    _onInputChange: Object => void;

    _onOpenHelp: () => void;

    /**
     * Opens a new tab with information on how to manually locate a YouTube
     * broadcast stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        window.open(this.props._liveStreaming.helpURL, '_blank', 'noopener');
    }

    _onOpenHelpKeyPress: () => void;

    /**
     * Opens a new tab with information on how to manually locate a YouTube
     * broadcast stream key.
     *
     * @param {Object} e - The key event to handle.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelpKeyPress(e) {
        if (e.key === ' ') {
            e.preventDefault();
            this._onOpenHelp();
        }
    }
}

export default translate(connect(_mapStateToProps)(StreamKeyForm));
