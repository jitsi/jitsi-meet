// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { translate } from '../../../base/i18n';

import AbstractStreamKeyForm, {
    type Props
} from './AbstractStreamKeyForm';

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @extends Component
 */
class StreamKeyForm extends AbstractStreamKeyForm {

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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { value, t } = this.props;

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
                    value = { this.state.value } />
                { this.helpURL
                    ? <div className = 'form-footer'>
                        <a
                            className = 'helper-link'
                            onClick = { this._onOpenHelp }>
                            { t('liveStreaming.streamIdHelp') }
                        </a>
                    </div>
                    : null
                }
            </div>
        );
    }

    _onInputChange: Object => void

    _onOpenHelp: () => void

    /**
     * Opens a new tab with information on how to manually locate a YouTube
     * broadcast stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        window.open(this.helpURL, 'noopener');
    }
}

export default translate(StreamKeyForm);
