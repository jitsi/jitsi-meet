import React from 'react';

import { translate } from '../../base/i18n';
import { randomInt } from '../../base/util';

import AbstractOverlay from './AbstractOverlay';
import ReloadTimer from './ReloadTimer';

declare var APP: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Implements a React Component for page reload overlay. Shown before the
 * conference is reloaded. Shows a warning message and counts down towards the
 * reload.
 */
class PageReloadOverlay extends AbstractOverlay {
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
         * How long the overlay dialog will be displayed, before the conference
         * will be reloaded.
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
             * Indicates the css style of the overlay. If true, then lighter;
             * darker, otherwise.
             *
             * @type {boolean}
             */
            isLightOverlay,

            /**
             * The translation key for the title of the overlay.
             *
             * @type {string}
             */
            message,

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
     * This method is executed when comonent is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

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
    }

    /**
     * Renders the button for relaod the page if necessary.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderButton() {
        if (this.props.isNetworkFailure) {
            const className
                = 'button-control button-control_primary button-control_center';
            const { t } = this.props;

            /* eslint-disable react/jsx-handler-names */

            return (
                <button
                    className = { className }
                    id = 'reconnectNow'
                    onClick = { this._reconnectNow }>
                    { t('dialog.reconnectNow') }
                </button>
            );


            /* eslint-enable react/jsx-handler-names */
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
        const { t } = this.props;

        /* eslint-disable react/jsx-handler-names */

        return (
            <div className = 'inlay'>
                <span
                    className = 'reload_overlay_title'>
                    { t(this.state.title) }
                </span>
                <span
                    className = 'reload_overlay_text'>
                    { t(this.state.message) }
                </span>
                <ReloadTimer
                    end = { 0 }
                    interval = { 1 }
                    onFinish = { this._reconnectNow }
                    start = { this.state.timeoutSeconds }
                    step = { -1 } />
                { this._renderButton() }
            </div>
        );

        /* eslint-enable react/jsx-handler-names */
    }
}

export default translate(PageReloadOverlay);
