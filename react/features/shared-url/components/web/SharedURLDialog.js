// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getFieldValue } from '../../../base/react';
import { connect } from '../../../base/redux';
import { defaultSharedURL } from '../../constants';
import { getSharedURL } from '../../functions';
import AbstractSharedURLDialog from '../AbstractSharedURLDialog';

/**
 * Component that renders the URL share dialog.
 *
 * @returns {React$Element<any>}
 */
class SharedURLDialog extends AbstractSharedURLDialog<*> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this.state = {
            value: '',
            okDisabled: true
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
            okDisabled: !getSharedURL(linkValue)
        });
    }

    _onSubmitValue: () => boolean;

    /**
     * Callback to be invoked when the value of the link input is submitted.
     *
     * @returns {boolean}
     */
    _onSubmitValue() {
        return this._onSetURL(this.state.value);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;
        // TODO: Make sure dialog.sharedURL and sharedURL are actually available here
        return (
            <Dialog
                hideCancelButton = { false }
                okDisabled = { this.state.okDisabled }
                okKey = { t('dialog.Share') }
                onSubmit = { this._onSubmitValue }
                titleKey = { t('dialog.shareURLTitle') }
                width = { 'small' }>
                <FieldTextStateless
                    autoFocus = { true }
                    className = 'input-control'
                    compact = { false }
                    label = { t('dialog.sharedURL') }
                    name = 'sharedURL'
                    onChange = { this._onChange }
                    placeholder = { defaultSharedURL }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.value } />
            </Dialog>
        );
    }

    _onSetURL: string => boolean;

    _onChange: Object => void;
}

export default translate(connect()(SharedURLDialog));
