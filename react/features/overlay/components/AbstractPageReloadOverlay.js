// @flow

import { randomInt } from '@jitsi/js-utils/random';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import {
    createPageReloadScheduledEvent,
    sendAnalytics
} from '../../analytics';
import { reloadNow } from '../../app/actions';
import {
    isFatalJitsiConferenceError,
    isFatalJitsiConnectionError
} from '../../base/lib-jitsi-meet';
import logger from '../logger';

import ReloadButton from './web/ReloadButton';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of
 * {@link AbstractPageReloadOverlay}.
 */
export type Props = {

    /**
     * The details is an object containing more information about the connection
     * failed (shard changes, was the computer suspended, etc.).
     */
    details: Object,

    dispatch: Dispatch<any>,

    /**
     * The indicator which determines whether the reload was caused by network
     * failure.
     */
    isNetworkFailure: boolean,

    /**
     * The reason for the error that will cause the reload.
     * NOTE: Used by PageReloadOverlay only.
     */
    reason: string,

    /**
     * The function to translate human-readable text.
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
     */
    message: string,

    /**
     * Current value(time) of the timer.
     */
    timeLeft: number,

    /**
     * How long the overlay dialog will be displayed before the conference will
     * be reloaded.
     */
    timeoutSeconds: number,

    /**
     * The translation key for the title of the overlay.
     */
    title: string
};

/**
 * Implements an abstract React {@link Component} for the page reload overlays.
 *
 * FIXME: This is not really an abstract class as some components and functions are very web specific.
 */
export default class AbstractPageReloadOverlay<P: Props>
    extends Component<P, State> {
    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRender(state: Object) {
        // FIXME web does not rely on the 'recoverable' flag set on an error
        // action, but on a predefined list of fatal errors. Because of that
        // the value of 'fatalError' which relies on the flag should not be used
        // on web yet (until conference/connection and their errors handling is
        // not unified).
        return typeof APP === 'undefined'
            ? Boolean(state['features/overlay'].fatalError)
            : this.needsRenderWeb(state);
    }

    /**
     * Determines whether this overlay needs to be rendered (according to a
     * specific redux state). Called by {@link OverlayContainer}.
     *
     * @param {Object} state - The redux state.
     * @returns {boolean} - If this overlay needs to be rendered, {@code true};
     * {@code false}, otherwise.
     */
    static needsRenderWeb(state: Object) {
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
    constructor(props: P) {
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

                        this.props.dispatch(reloadNow());
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
    const { error: configError } = state['features/base/config'];
    const { error: connectionError } = state['features/base/connection'];
    const { fatalError } = state['features/overlay'];

    return {
        details: fatalError && fatalError.details,
        isNetworkFailure:
            fatalError === configError || fatalError === connectionError,
        reason: fatalError && (fatalError.message || fatalError.name)
    };
}
