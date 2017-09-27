/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { randomInt } from '../../base/util';

import { _reloadNow } from '../actions';
import ReloadButton from './ReloadButton';

declare var AJS: Object;
declare var APP: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Implements abstract React Component for the page reload overlays.
 */
export default class AbstractPageReloadOverlay extends Component {
    /**
     * AbstractPageReloadOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: PropTypes.func,

        /**
         * The indicator which determines whether the reload was caused by
         * network failure.
         *
         * @public
         * @type {boolean}
         */
        isNetworkFailure: PropTypes.bool,

        /**
         * The reason for the error that will cause the reload.
         * NOTE: Used by PageReloadOverlay only.
         *
         * @public
         * @type {string}
         */
        reason: PropTypes.string,

        /**
         * The function to translate human-readable text.
         *
         * @public
         * @type {Function}
         */
        t: PropTypes.func
    };

    _interval: ?number

    state: {

        /**
         * The translation key for the title of the overlay.
         *
         * @type {string}
         */
        message: string,

        /**
         * Current value(time) of the timer.
         *
         * @type {number}
         */
        timeLeft: number,

        /**
         * How long the overlay dialog will be displayed before the
         * conference will be reloaded.
         *
         * @type {number}
         */
        timeoutSeconds: number,

        /**
         * The translation key for the title of the overlay.
         *
         * @type {string}
         */
        title: string
    }

    /**
     * Initializes a new AbstractPageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props: Object) {
        super(props);

        /**
         * How long the overlay dialog will be displayed, before the conference
         * will be reloaded.
         *
         * @type {number}
         */
        const timeoutSeconds = 10 + randomInt(0, 20);

        let message, title;

        if (this.props.isNetworkFailure) {
            title = 'dialog.conferenceDisconnectTitle';
            message = 'dialog.conferenceDisconnectMsg';
        } else {
            title = 'dialog.conferenceReloadTitle';
            message = 'dialog.conferenceReloadMsg';
        }

        this.state = {
            message,
            timeLeft: timeoutSeconds,
            timeoutSeconds,
            title
        };
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        // FIXME (CallStats - issue) This event will not make it to CallStats
        // because the log queue is not flushed before "fabric terminated" is
        // sent to the backed.
        // FIXME: We should dispatch action for this.
        APP.conference.logEvent(
            'page.reload',
            /* value */ undefined,
            /* label */ this.props.reason);
        logger.info(
            `The conference will be reloaded after ${
                this.state.timeoutSeconds} seconds.`);

        AJS.progressBars.update('#reloadProgressBar', 0);

        this._interval
            = setInterval(
                () => {
                    if (this.state.timeLeft === 0) {
                        if (this._interval) {
                            clearInterval(this._interval);
                            this._interval = undefined;
                        }

                        this.props.dispatch(_reloadNow());
                    } else {
                        this.setState(prevState => {
                            return {
                                timeLeft: prevState.timeLeft - 1
                            };
                        });
                    }
                },
                1000);
    }

    /**
     * React Component method that executes once component is updated.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate() {
        const { timeLeft, timeoutSeconds } = this.state;

        AJS.progressBars.update(
            '#reloadProgressBar',
            (timeoutSeconds - timeLeft) / timeoutSeconds);
    }

    /**
     * Clears the timer interval.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = undefined;
        }
    }

    /**
     * Renders the button for relaod the page if necessary.
     *
     * @protected
     * @returns {ReactElement|null}
     */
    _renderButton() {
        if (this.props.isNetworkFailure) {
            return (
                <ReloadButton textKey = 'dialog.rejoinNow' />
            );
        }

        return null;
    }

    /**
     * Renders the progress bar.
     *
     * @protected
     * @returns {ReactElement}
     */
    _renderProgressBar() {
        return (
            <div
                className = 'aui-progress-indicator'
                id = 'reloadProgressBar'>
                <span className = 'aui-progress-indicator-value' />
            </div>
        );
    }
}
