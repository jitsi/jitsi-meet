// @flow

import { Component } from 'react';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';

/**
 * An abstract implementation of a button for leaving the conference.
 */
export default class AbstractHangupButton extends Component<*> {
    /**
     * Initializes a new {@code AbstractHangupButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handler so it is only bound once per instance.
        this._onToolbarHangup = this._onToolbarHangup.bind(this);
    }

    /**
     * Dispatches an action for leaving the current conference.
     *
     * @private
     * @returns {void}
     */
    _doHangup() {
        /* to be implemented by descendants */
    }

    _onToolbarHangup: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for leaving
     * the current conference.
     *
     * @private
     * @returns {void}
     */
    _onToolbarHangup() {
        sendAnalytics(createToolbarEvent('hangup'));

        this._doHangup();
    }
}
