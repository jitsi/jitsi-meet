import { FieldTextStateless } from '@atlaskit/field-text';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @extends Component
 */
class StreamKeyForm extends Component {
    /**
     * {@code StreamKeyForm} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The URL to the page with more information for manually finding the
         * stream key for a YouTube broadcast.
         */
        helpURL: PropTypes.string,

        /**
         * Callback invoked when the entered stream key has changed.
         */
        onChange: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * The stream key value to display as having been entered so far.
         */
        value: PropTypes.string
    };

    /**
     * Initializes a new {@code StreamKeyForm} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyForm} instance with.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onInputChange = this._onInputChange.bind(this);
        this._onOpenHelp = this._onOpenHelp.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div className = 'stream-key-form'>
                <FieldTextStateless
                    autoFocus = { true }
                    compact = { true }
                    label = { t('dialog.streamKey') }
                    name = 'streamId'
                    okDisabled = { !this.props.value }
                    onChange = { this._onInputChange }
                    placeholder = { t('liveStreaming.enterStreamKey') }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.props.value } />
                { this.props.helpURL
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

    /**
     * Callback invoked when the value of the input field has updated through
     * user input.
     *
     * @param {Object} event - DOM Event for value change.
     * @private
     * @returns {void}
     */
    _onInputChange(event) {
        this.props.onChange(event);
    }

    /**
     * Opens a new tab with information on how to manually locate a YouTube
     * broadcast stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        window.open(this.props.helpURL, 'noopener');
    }
}

export default translate(StreamKeyForm);
