// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { translate } from '../../../../base/i18n';
import AbstractStreamKeyForm, {
    type Props
} from '../AbstractStreamKeyForm';
import { GOOGLE_PRIVACY_POLICY, YOUTUBE_TERMS_URL } from '../constants';

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @extends Component
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
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, value } = this.props;

        // https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
        function parseJwt(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        }

        return (
            <div className='stream-key-form'>
                <FieldTextStateless
                    autoFocus={true}
                    compact={true}
                    isSpellCheckEnabled={false}
                    label={t('dialog.streamKey')}
                    name='streamId'
                    okDisabled={!value}
                    onChange={this._onInputChange}
                    placeholder={t('liveStreaming.enterStreamKey')}
                    shouldFitContainer={true}
                    type='text'
                    value={this.props.value} />
                <div className='form-footer'>
                    <a
                        className='helper-link'
                        href={YOUTUBE_TERMS_URL}
                        rel='noopener noreferrer'
                        target='_blank'>
                        {t('liveStreaming.youtubeTerms')}
                    </a>
                </div>
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
        window.open(this.helpURL, '_blank', 'noopener');
    }
}

export default translate(StreamKeyForm);
