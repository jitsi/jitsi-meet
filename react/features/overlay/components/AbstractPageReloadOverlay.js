// @flow

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
    createPageReloadScheduledEvent,
    sendAnalytics
} from '../../analytics';
import {
    isFatalJitsiConferenceError,
    isFatalJitsiConnectionError
} from '../../base/lib-jitsi-meet';
import { randomInt } from '../../base/util';

import { _reloadNow } from '../actions';
import ReloadButton from './ReloadButton';

declare var APP: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Implements an abstract React {@link Component} for the page reload overlays.
 */
export default class AbstractPageReloadOverlay extends Component<*, *> {
    /**
     * {@code AbstractPageReloadOverlay} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The details is an object containing more information about the
         * connection failed (shard changes, was the computer suspended, etc.)
         *
         * @public
         * @type {object}
         */
        details: PropTypes.object,

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

    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state: Object) {
        const conferenceError = state['features/base/conference'].error;
        const configError = state['features/base/config'].error;
        const connectionError = state['features/base/connection'].error;

        return (
            (connectionError && isFatalJitsiConnectionError(connectionError))
                || (conferenceError
                    && isFatalJitsiConferenceError(conferenceError))
                || configError);
    }

    _interval: *;

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
    };

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
        if (typeof APP !== 'undefined') {
            if (APP.conference && APP.conference._room) {
                APP.conference._room.sendApplicationLog(JSON.stringify({
                    name: 'page.reload',
                    label: this.props.reason
                }));
            }
        }

        sendAnalytics(createPageReloadScheduledEvent(
            this.props.reason,
            this.state.timeoutSeconds,
            this.props.details));

        logger.info(
            `The conference will be reloaded after ${
                this.state.timeoutSeconds} seconds.`);

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
     * Renders the button for reloading the page if necessary.
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
        const { timeLeft, timeoutSeconds } = this.state;
        const timeRemaining = timeoutSeconds - timeLeft;
        const percentageComplete
            = Math.floor((timeRemaining / timeoutSeconds) * 100);

        return (
            <div
                className = 'progress-indicator'
                id = 'reloadProgressBar'>
                <div
                    className = 'progress-indicator-fill'
                    style = {{ width: `${percentageComplete}%` }} />
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated component's props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     details: Object,
 *     isNetworkFailure: boolean,
 *     reason: string
 * }}
 */
export function abstractMapStateToProps(state: Object) {
    const { error: conferenceError } = state['features/base/conference'];
    const { error: configError } = state['features/base/config'];
    const { error: connectionError } = state['features/base/connection'];

    return {
        details: connectionError ? connectionError.details : undefined,
        isNetworkFailure: Boolean(configError || connectionError),
        reason: (configError || connectionError || conferenceError).message
    };
}
