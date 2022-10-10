import React from 'react';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import AbstractSharedVideoDialog from '../AbstractSharedVideoDialog';

/**
 * Component that renders the video share dialog.
 *
 * @returns {React$Element<any>}
 */
class SharedVideoDialog extends AbstractSharedVideoDialog<any> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: any) {
        super(props);

        this.state = {
            value: '',
            okDisabled: true,
            error: false
        };

        this._onChange = this._onChange.bind(this);
        this._onSubmitValue = this._onSubmitValue.bind(this);
    }

    /**
     * Callback for the onChange event of the field.
     *
     * @param {string} value - The static event.
     * @returns {void}
     */
    _onChange(value: string) {
        this.setState({
            value,
            okDisabled: !value
        });
    }

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
                ok = {{
                    disabled: this.state.okDisabled,
                    translationKey: 'dialog.Share'
                }}
                onSubmit = { this._onSubmitValue }
                titleKey = 'dialog.shareVideoTitle'>
                <Input
                    autoFocus = { true }
                    className = 'dialog-bottom-margin'
                    error = { error }
                    label = { t('dialog.videoLink') }
                    name = 'sharedVideoUrl'
                    onChange = { this._onChange }
                    placeholder = { t('dialog.sharedVideoLinkPlaceholder') }
                    type = 'text'
                    value = { this.state.value } />
                { error && <span className = 'shared-video-dialog-error'>{ t('dialog.sharedVideoDialogError') }</span> }
            </Dialog>
        );
    }
}

export default translate(connect()(SharedVideoDialog));
