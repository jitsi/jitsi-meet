import _ from "lodash";
import React from "react";
import { WithTranslation } from "react-i18next";
import { connect as reactReduxConnect } from "react-redux";

// @ts-ignore
import VideoLayout from "../../../../../../modules/UI/videolayout/VideoLayout";
import { IReduxState } from "../../../../app/types";
import type { AbstractProps } from "../../../../conference/components/AbstractConference";
import { AbstractConference, abstractMapStateToProps } from "../../../../conference/components/AbstractConference";
import { maybeShowSuboptimalExperienceNotification } from "../../../../conference/functions.web";
import { toggleToolboxVisible } from "../../../../toolbox/actions.any";
import { fullScreenChanged, showToolbox } from "../../../../toolbox/actions.web";
import { hangup } from "../../../connection/actions.web";
import { translate } from "../../../i18n/functions";
import { setColorAlpha } from "../../../util/helpers";
import { Mode } from "./components/Header";

import { init } from "../../../../conference/actions.web";
import CreateConference from "./containers/CreateConference";
import JoinConference from "./containers/JoinConference";
import { appNavigate } from "../../../../app/actions.web";

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = ["webkitfullscreenchange", "mozfullscreenchange", "fullscreenchange"];

declare const APP: any;

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
interface IProps extends AbstractProps, WithTranslation {
    /**
     * The alpha(opacity) of the background.
     */
    _backgroundAlpha?: number;

    /**
     * Are any overlays visible?
     */
    _isAnyOverlayVisible: boolean;

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string;

    /**
     * The config specified interval for triggering mouseMoved iframe api events.
     */
    _mouseMoveCallbackInterval?: number;

    /**
     *Whether or not the notifications should be displayed in the overflow drawer.
     */
    _overflowDrawer: boolean;

    /**
     * Name for this conference room.
     */
    _roomName: string;

    /**
     * If lobby page is visible or not.
     */
    _showLobby: boolean;

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean;

    /**
     * If we should show the create meeting view (from /new-meeting)
     */
    _showNewMeeting: boolean;

    dispatch: any;
    roomId?: string;
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<IProps, any> {
    _originalOnMouseMove: Function;
    _originalOnShowToolbar: Function;

    _onSetVideoModeClicked = (newMode: Mode) => {
        this.setState({ videoMode: newMode });
    };
    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        const { _mouseMoveCallbackInterval } = props;

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._originalOnMouseMove = this._onMouseMove;

        this._onShowToolbar = _.throttle(() => this._originalOnShowToolbar(), 100, {
            leading: true,
            trailing: false,
        });

        this._onMouseMove = _.throttle((event) => this._originalOnMouseMove(event), _mouseMoveCallbackInterval, {
            leading: true,
            trailing: false,
        });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
        this._onVidespaceTouchStart = this._onVidespaceTouchStart.bind(this);
        this._setBackground = this._setBackground.bind(this);
        this._leaveMeeting = this._leaveMeeting.bind(this);
    }

    /**
     * Handles browser back/forward navigation.
     * If user presses back while in an active meeting, show confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handlePopState = () => {
        const { t } = this.props;

        if (APP.conference.isJoined()) {
            const confirmLeave = window.confirm(
                t('dialog.leaveMeetingConfirmation')
            );
            if (confirmLeave) {
                this.props.dispatch(hangup(false, this.props.roomId));
                window.history.pushState(null, '', '/');
            } else {
                window.history.pushState(null, '', `/${this.props.roomId}`);
            }
        } else {
            this.props.dispatch(appNavigate(window.location.pathname + window.location.search));
        }
    };

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        document.title = `${interfaceConfig.APP_NAME}`;
        this._start();

        window.addEventListener("beforeunload", this._handleBeforeUnload, true);
        window.addEventListener("popstate", this._handlePopState);
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    override componentDidUpdate() {
        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        try {
            VideoLayout.refreshLayout();
        } catch (error) {
            // Ignore errors during layout refresh - the layout may not be ready yet
            console.warn("VideoLayout.refreshLayout() failed:", error);
        }
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach((name) => document.removeEventListener(name, this._onFullScreenChange));

        window.removeEventListener("beforeunload", this._handleBeforeUnload, true);
        window.removeEventListener("popstate", this._handlePopState);

        APP.conference.isJoined() && this.props.dispatch(hangup(true, this.props.roomId));
    }

    /**
     * Handler for beforeunload event that shows a confirmation dialog
     * when user tries to close the tab or browser during a meeting.
     *
     * @param {BeforeUnloadEvent} event - The beforeunload event.
     * @private
     * @returns {string}
     */
    _handleBeforeUnload = (event: BeforeUnloadEvent): string => {
        if (APP.conference.isJoined()) {
            event.preventDefault();
            event.stopImmediatePropagation();

            event.returnValue = '';
            return '';
        }
        return "";
    };

    /**
     * Handles the action to leave the meeting immediately.
     * This is triggered when the user clicks the "X" button.
     *
     * @private
     * @returns {void}
     */
    _leaveMeeting(): void {
        this.props.dispatch(hangup(true, this.props.roomId));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { _showNewMeeting } = this.props;
        return (
            <div
                id="layout_wrapper"
                onMouseEnter={this._onMouseEnter}
                onMouseLeave={this._onMouseLeave}
                onMouseMove={this._onMouseMove}
                ref={this._setBackground}
            >
                {_showNewMeeting ? <CreateConference /> : <JoinConference />}
            </div>
        );
    }

    /**
     * Sets custom background opacity based on config. It also applies the
     * opacity on parent element, as the parent element is not accessible directly,
     * only though it's child.
     *
     * @param {Object} element - The DOM element for which to apply opacity.
     *
     * @private
     * @returns {void}
     */
    _setBackground(element: HTMLDivElement) {
        if (!element) {
            return;
        }

        if (this.props._backgroundAlpha !== undefined) {
            const elemColor = element.style.background;
            const alphaElemColor = setColorAlpha(elemColor, this.props._backgroundAlpha);

            element.style.background = alphaElemColor;
            if (element.parentElement) {
                const parentColor = element.parentElement.style.background;
                const alphaParentColor = setColorAlpha(parentColor, this.props._backgroundAlpha);

                element.parentElement.style.background = alphaParentColor;
            }
        }
    }

    /**
     * Handler used for touch start on Video container.
     *
     * @private
     * @returns {void}
     */
    _onVidespaceTouchStart() {
        this.props.dispatch(toggleToolboxVisible());
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
     * Triggers iframe API mouseEnter event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseEnter(event: React.MouseEvent) {
        APP.API.notifyMouseEnter(event);
    }

    /**
     * Triggers iframe API mouseLeave event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseLeave(event: React.MouseEvent) {
        APP.API.notifyMouseLeave(event);
    }

    /**
     * Triggers iframe API mouseMove event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseMove(event: React.MouseEvent) {
        APP.API.notifyMouseMove(event);
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

        // APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach((name) => document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;
        dispatch(init(false));

        maybeShowSuboptimalExperienceNotification(dispatch, t);
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { backgroundAlpha } = state["features/base/config"];
    const { showCreatingMeeting } = state["features/prejoin"];
    const _room = state["features/base/conference"].room;

    return {
        ...abstractMapStateToProps(state),
        _backgroundAlpha: backgroundAlpha,
        _showNewMeeting: showCreatingMeeting,
        roomId: _room,
    };
}

export default translate(reactReduxConnect(_mapStateToProps)(Conference));
