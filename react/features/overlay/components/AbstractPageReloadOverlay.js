import React, { Component } from 'react';

import { randomInt } from '../../base/util';

import { reconnectNow } from '../functions';
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
        /**
         * The indicator which determines whether the reload was caused by
         * network failure.
         *
         * @public
         * @type {boolean}
         */
        isNetworkFailure: React.PropTypes.bool,

        /**
         * The reason for the error that will cause the reload.
         * NOTE: Used by PageReloadOverlay only.
         *
         * @public
         * @type {string}
         */
        reason: React.PropTypes.string
    }

    /**
     * Initializes a new AbstractPageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
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
            /**
             * The translation key for the title of the overlay.
             *
             * @type {string}
             */
            message,

            /**
             * Current value(time) of the timer.
             *
             * @type {number}
             */
            timeLeft: timeoutSeconds,

            /**
             * How long the overlay dialog will be displayed before the
             * conference will be reloaded.
             *
             * @type {number}
             */
            timeoutSeconds,

            /**
             * The translation key for the title of the overlay.
             *
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
            return (
                <ReloadButton textKey = 'dialog.rejoinNow' />
            );
        }

        return null;
    }

    /**
     * Renders the progress bar.
     *
     * @returns {ReactElement|null}
     * @protected
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

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     * @protected
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
                'The conference will be reloaded after '
                    + `${this.state.timeoutSeconds} seconds.`);

        AJS.progressBars.update('#reloadProgressBar', 0);

        this.intervalId = setInterval(() => {
            if (this.state.timeLeft === 0) {
                clearInterval(this.intervalId);
                reconnectNow();
            } else {
                this.setState(prevState => {
                    return {
                        timeLeft: prevState.timeLeft - 1
                    };
                });
            }
        }, 1000);
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
            (this.state.timeoutSeconds - this.state.timeLeft)
                / this.state.timeoutSeconds);
    }

    /**
     * Clears the timer interval.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        clearInterval(this.intervalId);
    }
}
