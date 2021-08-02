// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { defaultSharedVideoLink } from '../../constants';
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
        return (
            <InputDialog
                contentKey = 'dialog.shareVideoTitle'
                onSubmit = { this._onSubmitValue }
                textInputProps = {{
                    placeholder: defaultSharedVideoLink
                }} />
        );
    }
}

export default connect()(SharedVideoDialog);
