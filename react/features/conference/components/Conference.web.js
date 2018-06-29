// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { obtainConfig } from '../../base/config';
import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { Filmstrip } from '../../filmstrip';
import { CalleeInfoContainer } from '../../invite';
import { LargeVideo } from '../../large-video';
import { NotificationsContainer } from '../../notifications';
import { SidePanel } from '../../side-panel';
import {
    Toolbox,
    fullScreenChanged,
    setToolboxAlwaysVisible,
    showToolbox
} from '../../toolbox';

import { maybeShowSuboptimalExperienceNotification } from '../functions';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Promise wrapper on obtain config method. When HttpConfigFetch will be moved
 * to React app it's better to use load config instead.
 *
 * @param {string} location - URL of the domain from which the config is to be
 * obtained.
 * @param {string} room - Room name.
 * @private
 * @returns {Promise}
 */
function _obtainConfig(location: string, room: string) {
    return new Promise((resolve, reject) =>
        obtainConfig(location, room, (success, error) => {
            success ? resolve() : reject(error);
        })
    );
}

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = {

    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

    /**
     * Conference room name.
     */
    _room: string,

    dispatch: Function,
    t: Function
}

/**
 * The conference page of the Web application.
 */
class Conference extends Component<Props> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false
            });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        const { configLocation } = config;

        if (configLocation) {
            _obtainConfig(configLocation, this.props._room)
                .then(() => {
                    const now = window.performance.now();

                    APP.connectionTimes['configuration.fetched'] = now;
                    logger.log('(TIME) configuration fetched:\t', now);

                    this._start();
                })
                .catch(err => {
                    logger.log(err);

                    // Show obtain config error.
                    APP.UI.messageHandler.showError({
                        titleKey: 'connection.CONNFAIL',
                        descriptionKey: 'dialog.connectError'
                    });
                });
        } else {
            this._start();
        }
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unregisterListeners();
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.removeEventListener(name, this._onFullScreenChange));

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            VIDEO_QUALITY_LABEL_DISABLED,

            // XXX The character casing of the name filmStripOnly utilized by
            // interfaceConfig is obsolete but legacy support is required.
            filmStripOnly: filmstripOnly
        } = interfaceConfig;
        const hideVideoQualityLabel
            = filmstripOnly
                || VIDEO_QUALITY_LABEL_DISABLED
                || this.props._iAmRecorder;

        return (
            <div
                id = 'videoconference_page'
                onMouseMove = { this._onShowToolbar }>
                <div id = 'videospace'>
                    <LargeVideo
                        hideVideoQualityLabel = { hideVideoQualityLabel } />
                    <Filmstrip filmstripOnly = { filmstripOnly } />
                </div>

                { filmstripOnly || <Toolbox /> }
                { filmstripOnly || <SidePanel /> }

                <DialogContainer />
                <NotificationsContainer />

                <CalleeInfoContainer />
            </div>
        );
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);

        interfaceConfig.filmStripOnly
            && dispatch(setToolboxAlwaysVisible(true));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _iAmRecorder: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { room } = state['features/base/conference'];
    const { iAmRecorder } = state['features/base/config'];

    return {
        /**
         * Whether the local participant is recording the conference.
         *
         * @private
         */
        _iAmRecorder: iAmRecorder,

        /**
         * Conference room name.
         */
        _room: room
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
