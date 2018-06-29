// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../base/dialog/index';
import { translate } from '../../base/i18n/index';

import { dialTranscriber } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link StartTranscribingDialog}.
 */
type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Invoked to active other features of the app.
     */
    dispatch: Function
};

/**
 * React Component for getting confirmation to start a transcribing session.
 *
 * @extends Component
 */
class StartTranscribingDialog extends Component<Props> {
    /**
     * Initializes a new {@code StartTranscribing} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okTitleKey = 'dialog.confirm'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.transcribing'
                width = 'small'>
                { this.props.t('transcribing.startTranscribingBody') }
            </Dialog>
        );
    }

    _onSubmit: () => boolean;

    /**
     * Starts a transcribing session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        this.props.dispatch(dialTranscriber());

        return true;
    }
}

export default translate(connect()(StartTranscribingDialog));
