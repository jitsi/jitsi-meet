// @flow

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
 * The maximum time, inclusive, for a page reload to happen without a countdown
 * when an "item-not-found" error is encountered after a strophe connection has
 * been established. It is assumed that an "item-not-found" error early on in
 * the connection lifetime is an indication of a split-brain scenario, so the
 * user should not have wait to be placed onto the new bridge.
 *
 */
const RELOAD_IMMEDIATELY_THRESHOLD = 1500;

/**
 * The type of the React {@code Component} props of
 * {@link AbstractPageReloadOverlay}.
 */
type Props = {

   /**
     * The details is an object containing more information about the connection
     * failed (shard changes, was the computer suspended, etc.)
     *
     * @public
     * @type {object}
     */
    details: Object,

    dispatch: Function,

    /**
     * The indicator which determines whether the reload was caused by network
     * failure.
     *
     * @public
     * @type {boolean}
     */
    isNetworkFailure: boolean,

    /**
     * The reason for the error that will cause the reload. NOTE: Used by
     * {@code PageReloadOverlay} only.
     *
     * @public
     * @type {string}
     */
    reason: string,

    /**
     * Whether or not reload should happen without a countdown.
     *
     * @type {boolean}
     */
    reloadImmediately: boolean,

    /**
     * The function to translate human-readable text.
     *
     * @public
     * @type {Function}
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of
 * {@link AbstractPageReloadOverlay}.
 */
type State = {

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
     * How long the overlay dialog will be displayed before the conference will
     * be reloaded.
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
 * Implements an abstract React {@link Component} for the page reload overlays.
 */
export default class AbstractPageReloadOverlay extends Component<Props, State> {
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

    _interval: ?IntervalID;

    /**
     * Initializes a new AbstractPageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props: Props) {
        super(props);

        const { isNetworkFailure, reloadImmediately } = this.props;

        /**
         * How long the overlay dialog will be displayed, before the conference
         * will be reloaded.
         *
         * @type {number}
         */
        const timeoutSeconds = reloadImmediately ? 0 : 10 + randomInt(0, 20);

        let message, title;

        if (reloadImmediately) {
            title = 'dialog.conferenceReloadTitle';
            message = 'dialog.conferenceReloadImmediatelyMsg';
        } else if (isNetworkFailure) {
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
        if (this.props.reloadImmediately || !this.props.isNetworkFailure) {
            return null;
        }

        return (
            <ReloadButton textKey = 'dialog.rejoinNow' />
        );
    }

    /**
     * Renders the progress bar.
     *
     * @protected
     * @returns {ReactElement}
     */
    _renderProgressBar() {
        if (this.props.reloadImmediately) {
            return null;
        }

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
 *     reason: string,
 *     reloadImmediately: boolean
 * }}
 */
export function abstractMapStateToProps(state: Object) {
    const { error: conferenceError } = state['features/base/conference'];
    const { error: configError } = state['features/base/config'];
    const {
        error: connectionError,
        timeEstablished
    } = state['features/base/connection'];

    return {
        details: connectionError ? connectionError.details : undefined,
        isNetworkFailure: Boolean(configError || connectionError),
        reason: (configError || connectionError || conferenceError).message,
        reloadImmediately: Boolean(connectionError)
            && connectionError.message === 'item-not-found'
            && (!timeEstablished
                || Date.now() - timeEstablished <= RELOAD_IMMEDIATELY_THRESHOLD)
    };
}
