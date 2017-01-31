/* global APP, AJS */

import React, { Component } from 'react';

import { randomInt } from '../../base/util/randomUtil';

import AbstractOverlay from './AbstractOverlay';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Implements a React Component for the reload timer. Starts counter from
 * props.start, adds props.step to the current value on every props.interval
 * seconds until the current value reaches props.end. Also displays progress
 * bar.
 */
class ReloadTimer extends Component {
    /**
     * ReloadTimer component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The end of the timer. When this.state.current reaches this
         * value the timer will stop and call onFinish function.
         * @public
         * @type {number}
         */
        end: React.PropTypes.number,

        /**
         * The interval in sec for adding this.state.step to this.state.current
         * @public
         * @type {number}
         */
        interval: React.PropTypes.number,

        /**
         * The function that will be executed when timer finish (when
         * this.state.current === this.props.end)
         */
        onFinish: React.PropTypes.func,

        /**
         * The start of the timer. The initial value for this.state.current.
         * @public
         * @type {number}
         */
        start: React.PropTypes.number,

        /**
         * The value which will be added to this.state.current on every step.
         * @public
         * @type {number}
         */
        step: React.PropTypes.number
    }

    /**
     * Initializes a new ReloadTimer instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
        super(props);
        this.state = {
            current: this.props.start,
            time: Math.abs(this.props.end - this.props.start)
        };
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     * @protected
     */
    componentDidMount() {
        AJS.progressBars.update('#reloadProgressBar', 0);
        const intervalId = setInterval(() => {
            if (this.state.current === this.props.end) {
                clearInterval(intervalId);
                this.props.onFinish();

                return;
            }
            this.setState((prevState, props) => {
                return { current: prevState.current + props.step };
            });
        }, Math.abs(this.props.interval) * 1000);
    }

    /**
     * React Component method that executes once component is updated.
     *
     * @inheritdoc
     * @returns {void}
     * @protected
     */
    componentDidUpdate() {
        AJS.progressBars.update('#reloadProgressBar',
            Math.abs(this.state.current - this.props.start) / this.state.time);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     * @public
     */
    render() {
        return (
            <div>
                <div
                    className = 'aui-progress-indicator'
                    id = 'reloadProgressBar'>
                    <span className = 'aui-progress-indicator-value' />
                </div>
                <span
                    className = 'reload_overlay_text'
                    id = 'reloadSeconds'>
                    { this.state.current }
                    <span data-i18n = 'dialog.conferenceReloadTimeLeft' />
                </span>
            </div>
        );
    }
}

/**
 * Implements a React Component for page reload overlay. Shown before
 * the conference is reloaded. Shows a warning message and counts down towards
 * the reload.
 */
export default class PageReloadOverlay extends AbstractOverlay {
    /**
     * PageReloadOverlay component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The indicator which determines whether the reload was caused by
         * network failure.
         * @public
         * @type {boolean}
         */
        isNetworkFailure: React.PropTypes.bool,

        /**
         * The reason for the error that will cause the reload.
         * NOTE: Used by PageReloadOverlay only.
         * @public
         * @type {string}
         */
        reason: React.PropTypes.string
    }

    /**
     * Initializes a new PageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
        super(props);

        /**
         * How long the overlay dialog will be
         * displayed, before the conference will be reloaded.
         * @type {number}
         */
        const timeoutSeconds = 10 + randomInt(0, 20);

        let isLightOverlay, message, title;

        if (this.props.isNetworkFailure) {
            title = 'dialog.conferenceDisconnectTitle';
            message = 'dialog.conferenceDisconnectMsg';
            isLightOverlay = true;
        } else {
            title = 'dialog.conferenceReloadTitle';
            message = 'dialog.conferenceReloadMsg';
            isLightOverlay = false;
        }

        this.state = {
            ...this.state,

            /**
             * Indicates the css style of the overlay. if true - lighter  and
             * darker otherwise.
             * @type {boolean}
             */
            isLightOverlay,

            /**
             * The translation key for the title of the overlay
             * @type {string}
             */
            message,

            /**
             * How long the overlay dialog will be
             * displayed, before the conference will be reloaded.
             * @type {number}
             */
            timeoutSeconds,

            /**
             * The translation key for the title of the overlay
             * @type {string}
             */
            title
        };
    }

    /**
     * Renders the button for relaod the page if necessary.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderButton() {
        if (this.props.isNetworkFailure) {
            const cName = 'button-control button-control_primary '
                + 'button-control_center';

            /* eslint-disable react/jsx-handler-names */

            return (
                <button
                    className = { cName }
                    data-i18n = 'dialog.reconnectNow'
                    id = 'reconnectNow'
                    onClick = { this._reconnectNow } />
            );
        }

        return null;
    }

    /**
     * Constructs overlay body with the warning message and count down towards
     * the conference reload.
     *
     * @returns {ReactElement|null}
     * @override
     * @protected
     */
    _renderOverlayContent() {

        /* eslint-disable react/jsx-handler-names */

        return (
            <div className = 'inlay'>
                <span
                    className = 'reload_overlay_title'
                    data-i18n = { this.state.title } />
                <span
                    className = 'reload_overlay_text'
                    data-i18n = { this.state.message } />
                <ReloadTimer
                    end = { 0 }
                    interval = { 1 }
                    onFinish = { this._reconnectNow }
                    start = { this.state.timeoutSeconds }
                    step = { -1 } />
                { this._renderButton() }
            </div>
        );
    }

    /**
     * This method is executed when comonent is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

        // FIXME (CallStats - issue) this event will not make it to
        // the CallStats, because the log queue is not flushed, before
        // "fabric terminated" is sent to the backed
        // FIXME: We should dispatch action for this
        APP.conference.logEvent('page.reload', undefined /* value */,
            this.props.reason /* label */);
        logger.info(`The conference will be reloaded after
            ${this.state.timeoutSeconds} seconds.`);
    }
}
