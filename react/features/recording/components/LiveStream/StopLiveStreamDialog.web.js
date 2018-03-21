import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

/**
 * A React Component for confirming the participant wishes to stop the currently
 * active live stream of the conference.
 *
 * @extends Component
 */
class StopLiveStreamDialog extends Component {
    /**
     * {@code StopLiveStreamDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Callback to invoke when the dialog is dismissed without confirming
         * the live stream should be stopped.
         */
        onCancel: PropTypes.func,

        /**
         * Callback to invoke when confirming the live stream should be stopped.
         */
        onSubmit: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code StopLiveStreamDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
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
                okTitleKey = 'dialog.stopLiveStreaming'
                onCancel = { this.props.onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.liveStreaming'
                width = 'small'>
                { this.props.t('dialog.stopStreamingWarning') }
            </Dialog>
        );
    }

    /**
     * Callback invoked when stopping of live streaming is confirmed.
     *
     * @private
     * @returns {boolean} True to close the modal.
     */
    _onSubmit() {
        this.props.onSubmit();

        return true;
    }
}

export default translate(StopLiveStreamDialog);
