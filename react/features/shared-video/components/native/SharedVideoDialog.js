// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractSharedVideoDialog from '../AbstractSharedVideoDialog';

/**
 * Implements a component to render a display name prompt.
 */
class SharedVideoDialog extends AbstractSharedVideoDialog<*> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            error: false
        };

        this._onSubmitValue = this._onSubmitValue.bind(this);
    }

    _onSubmitValue: () => boolean;

    /**
     * Callback to be invoked when the value of the link input is submitted.
     *
     * @param {string} value - The entered video link.
     * @returns {boolean}
     */
    _onSubmitValue(value) {
        const result = super._onSetVideoLink(value);

        if (!result) {
            this.setState({ error: true });
        }

        return result;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;
        const { error } = this.state;

        return (
            <InputDialog
                messageKey = { error ? 'dialog.sharedVideoDialogError' : undefined }
                onSubmit = { this._onSubmitValue }
                textInputProps = {{
                    autoCapitalize: 'none',
                    autoCorrect: false,
                    placeholder: t('dialog.sharedVideoLinkPlaceholder')
                }}
                titleKey = 'dialog.shareVideoTitle' />
        );
    }
}

export default translate(connect()(SharedVideoDialog));
