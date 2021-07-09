// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getFieldValue } from '../../../base/react';
import { connect } from '../../../base/redux';
import { defaultSharedVideoLink } from '../../constants';
import { getYoutubeId } from '../../functions';
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
        return this._onSetVideoLink(this.state.value);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

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
                    label = { t('dialog.videoLink') }
                    name = 'sharedVideoUrl'
                    onChange = { this._onChange }
                    placeholder = { defaultSharedVideoLink }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.value } />
            </Dialog>
        );
    }

    /**
     * Validates the entered video link by extracting the id and dispatches it.
     *
     * It returns a boolean to comply the Dialog behaviour:
     *     {@code true} - the dialog should be closed.
     *     {@code false} - the dialog should be left open.
     *
    * @param {string} link - The entered video link.
     * @returns {boolean}
     */
    _onSetVideoLink(link: string) {
        if (!link || !link.trim()) {
            return false;
        }

        const youtubeId = getYoutubeId(link);
        const { onPostSubmit } = this.props;

        onPostSubmit(youtubeId || link);

        return true;
    }

    _onChange: Object => void;
}

export default translate(connect()(SharedVideoDialog));
