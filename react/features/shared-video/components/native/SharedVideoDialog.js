// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { ColorPalette } from '../../../base/styles';
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
        return super._onSetVideoLink(value);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        return (
            <InputDialog
                contentKey = 'dialog.shareVideoTitle'
                onSubmit = { this._onSubmitValue }
                textInputProps = {{
                    autoCapitalize: 'none',
                    autoCorrect: false,
                    placeholder: t('dialog.sharedVideoLinkPlaceholder'),
                    placeholderTextColor: ColorPalette.lightGrey
                }} />
        );
    }
}

export default translate(connect()(SharedVideoDialog));
