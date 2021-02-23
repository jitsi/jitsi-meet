// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { defaultSharedVideoLink } from '../../';
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractSharedVideoDialog from '../AbstractSharedVideoDialog';

/**
 * Component that renders the video share dialog.
 *
 * @returns {React$Element<any>}
 */
class SharedVideoDialog extends AbstractSharedVideoDialog<*> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t, value } = this.props;
        const { okDisabled } = this.state;

        return (
            <Dialog
                hideCancelButton = { false }
                okDisabled = { okDisabled }
                okKey = { t('dialog.Share') }
                onSubmit = { this._onSubmit }
                titleKey = { t('dialog.shareVideoTitle') }
                width = { 'small' }>
                <FieldTextStateless
                    autoFocus = { true }
                    compact = { false }
                    label = { t('dialog.videoLink') }
                    onChange = { this._onChange }
                    placeholder = { defaultSharedVideoLink }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { value } />
            </Dialog>
        );
    }
}

export default translate(connect()(SharedVideoDialog));
