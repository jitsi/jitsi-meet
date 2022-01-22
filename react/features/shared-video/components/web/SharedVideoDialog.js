// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getFieldValue } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractSharedVideoDialog from '../AbstractSharedVideoDialog';

/**
 * Component that renders the video share dialog.
 *
 * @returns {React$Element<any>}
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
            value: '',
            okDisabled: true,
            error: false
        };

        this._onChange = this._onChange.bind(this);
        this._onSubmitValue = this._onSubmitValue.bind(this);
    }

    _onChange: Object => void;

    /**
     * Callback for the onChange event of the field.
     *
     * @param {Object} evt - The static event.
     * @returns {void}
     */
    _onChange(evt: Object) {
        const linkValue = getFieldValue(evt);

        this.setState({
            value: linkValue,
            okDisabled: !linkValue
        });
    }

    _onSubmitValue: () => boolean;

    /**
     * Callback to be invoked when the value of the link input is submitted.
     *
     * @returns {boolean}
     */
    _onSubmitValue() {
        const result = super._onSetVideoLink(this.state.value);

        if (!result) {
            this.setState({
                error: true
            });
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
            <Dialog
                hideCancelButton = { false }
                okDisabled = { this.state.okDisabled }
                okKey = { t('dialog.Share') }
                onSubmit = { this._onSubmitValue }
                titleKey = { t('dialog.shareVideoTitle') }
                width = { 'small' }>
                <FieldTextStateless
                    autoFocus = { true }
                    className = 'input-control'
                    compact = { false }
                    isInvalid = { error }
                    label = { t('dialog.videoLink') }
                    name = 'sharedVideoUrl'
                    onChange = { this._onChange }
                    placeholder = { t('dialog.sharedVideoLinkPlaceholder') }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.value } />
                { error && <span className = 'shared-video-dialog-error'>{ t('dialog.sharedVideoDialogError') }</span> }
            </Dialog>
        );
    }

    _onChange: Object => void;
}

export default translate(connect()(SharedVideoDialog));
