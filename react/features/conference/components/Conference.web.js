// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { connect as reactReduxConnect } from 'react-redux';

import { connect, disconnect } from '../../base/connection';
import { DialogContainer } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { CalleeInfoContainer } from '../../base/jwt';
import { HideNotificationBarStyle } from '../../base/react';
import { Filmstrip } from '../../filmstrip';
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
declare var interfaceConfig: Object;

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
     * Whether the toolbar should stay visible or be able to autohide.
     */
    _alwaysVisibleToolbar: boolean,

    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

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
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { _alwaysVisibleToolbar, dispatch, t } = this.props;

        dispatch(connect());
        maybeShowSuboptimalExperienceNotification(dispatch, t);

        dispatch(setToolboxAlwaysVisible(
            _alwaysVisibleToolbar || interfaceConfig.filmStripOnly));
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

                {/*
                  * Temasys automatically injects a notification bar, if
                  * necessary, displayed at the top of the page notifying that
                  * WebRTC is not installed or supported. We do not need/want
                  * the notification bar in question because we have whole pages
                  * dedicated to the respective scenarios.
                  */}
                <HideNotificationBarStyle />
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
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _alwaysVisibleToolbar: boolean,
 *     _iAmRecorder: boolean
 * }}
 */
function _mapStateToProps(state) {
    const {
        alwaysVisibleToolbar,
        iAmRecorder
    } = state['features/base/config'];

    return {
        /**
         * Whether the toolbar should stay visible or be able to autohide.
         *
         * @private
         */
        _alwaysVisibleToolbar: alwaysVisibleToolbar,

        /**
         * Whether the local participant is recording the conference.
         *
         * @private
         */
        _iAmRecorder: iAmRecorder
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
