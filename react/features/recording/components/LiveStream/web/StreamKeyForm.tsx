import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import Input from '../../../../base/ui/components/web/Input';
import AbstractStreamKeyForm, {
    IProps, _mapStateToProps
} from '../AbstractStreamKeyForm';

const styles = (theme: Theme) => {
    return {
        helperLink: {
            cursor: 'pointer',
            color: theme.palette.link01,
            transition: 'color .2s ease',
            ...withPixelLineHeight(theme.typography.labelBold),
            marginLeft: 'auto',
            marginTop: theme.spacing(1),

            '&:hover': {
                textDecoration: 'underline',
                color: theme.palette.link01Hover
            },

            '&:active': {
                color: theme.palette.link01Active
            }
        }
    };
};

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @augments Component
 */
class StreamKeyForm extends AbstractStreamKeyForm<IProps> {

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
                <Input
                    autoFocus = { true }
                    id = 'streamkey-input'
                    label = { t('dialog.streamKey') }
                    name = 'streamId'
                    onChange = { this._onInputChange }
                    placeholder = { t('liveStreaming.enterStreamKey') }
                    type = 'text'
                    value = { value } />
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
                                className = { classes.helperLink }
                                href = { this.props._liveStreaming.helpURL }
                                rel = 'noopener noreferrer'
                                target = '_blank'>
                                { t('liveStreaming.streamIdHelp') }
                            </a>
                            : null
                        }
                    </div>
                    <a
                        className = { classes.helperLink }
                        href = { this.props._liveStreaming.termsURL }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.youtubeTerms') }
                    </a>
                    <a
                        className = { classes.helperLink }
                        href = { this.props._liveStreaming.dataPrivacyURL }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('liveStreaming.googlePrivacyPolicy') }
                    </a>
                </div>
            </div>
        );
    }
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(StreamKeyForm)));
