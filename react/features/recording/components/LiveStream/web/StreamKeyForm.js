// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';

import { translate } from '../../../../base/i18n';
import AbstractStreamKeyForm, {
    type Props as AbstractProps
} from '../AbstractStreamKeyForm';
import { GOOGLE_PRIVACY_POLICY, YOUTUBE_TERMS_URL } from '../constants';

type Props = AbstractProps & {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,
}

/**
 * Creates the styles for the component.
 *
 * @returns {Object}
 */
const styles = () => {
    return {
        root: {},
        formFooter: {
            display: 'flex',
            marginTop: '5px',
            textAlign: 'right',
            flexDirection: 'column'
        },
        helpContainer: {
            display: 'flex'
        },
        helperLink: {
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'inline-block',
            flexShrink: 0,
            marginLeft: 'auto'
        }
    };
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
        const { classes, t, value } = this.props;

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
                <div className = { classes.formFooter }>
                    <div className = { classes.helpContainer }>
                        {
                            this.state.showValidationError
                                ? <span className = 'warning-text'>
                                    { t('liveStreaming.invalidStreamKey') }
                                </span>
                                : null
                        }
                        { this.helpURL
                            ? <a
                                aria-label = { t('liveStreaming.streamIdHelp') }
                                className = { classes.helperLink }
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
                        className = { classes.helperLink }
                        href = { YOUTUBE_TERMS_URL }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.youtubeTerms') }
                    </a>
                    <a
                        className = { classes.helperLink }
                        href = { GOOGLE_PRIVACY_POLICY }
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
        window.open(this.helpURL, '_blank', 'noopener');
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

export default translate(withStyles(styles)(StreamKeyForm));
