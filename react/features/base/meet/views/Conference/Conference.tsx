import _ from "lodash";
import React from "react";
import { WithTranslation } from "react-i18next";
import { connect as reactReduxConnect } from "react-redux";

// @ts-ignore
import VideoLayout from "../../../../../../modules/UI/videolayout/VideoLayout";
import { IReduxState } from "../../../../app/types";
import Chat from "../../../../chat/components/web/Chat";
import { init } from "../../../../conference/actions.web";
import type { AbstractProps } from "../../../../conference/components/AbstractConference";
import { AbstractConference, abstractMapStateToProps } from "../../../../conference/components/AbstractConference";
import { maybeShowSuboptimalExperienceNotification } from "../../../../conference/functions.web";
import CalleeInfoContainer from "../../../../invite/components/callee-info/CalleeInfoContainer";
import LobbyScreen from "../../../../lobby/components/web/LobbyScreen";
import { getIsLobbyVisible } from "../../../../lobby/functions";
import { getOverlayToRender } from "../../../../overlay/functions.web";
import ParticipantsPane from "../../../../participants-pane/components/web/ParticipantsPane";
import Prejoin from "../../../../prejoin/components/web/Prejoin";
import { isPrejoinPageVisible } from "../../../../prejoin/functions";
import ReactionAnimations from "../../../../reactions/components/web/ReactionsAnimations";
import { toggleToolboxVisible } from "../../../../toolbox/actions.any";
import { fullScreenChanged, showToolbox } from "../../../../toolbox/actions.web";
import JitsiPortal from "../../../../toolbox/components/web/JitsiPortal";
import { LAYOUT_CLASSNAMES } from "../../../../video-layout/constants";
import { getCurrentLayout } from "../../../../video-layout/functions.any";
import { getConferenceNameForTitle } from "../../../conference/functions";
import { hangup } from "../../../connection/actions.web";
import { isMobileBrowser } from "../../../environment/utils";
import { translate } from "../../../i18n/functions";
import { setColorAlpha } from "../../../util/helpers";

import ConferenceInfo from "../../../../conference/components/web/ConferenceInfo";
import { default as Notice } from "../../../../conference/components/web/Notice";
import Header, { Mode } from "./components/Header";

import ConferenceControlsWrapper from "./containers/ConferenceControlsWrapper";
import VideoGalleryWrapper from "./containers/VideoGalleryWrapper";
import { SET_NEW_MEETING_PAGE_VISIBILITY, SET_PREJOIN_PAGE_VISIBILITY } from "../../../../prejoin/actionTypes";
import { DEFAULT_STATE } from "../../../known-domains/reducer";
import PersistenceRegistry from "../../../redux/PersistenceRegistry";
import { appNavigate } from "../../../../app/actions.web";
import { get8x8BetaJWT } from "../../../connection/options8x8";
import CreateConference from "./CreateConference";

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

    dispatch: any;

    isParticipantsPaneOpened: boolean;
    _showNewMeeting: boolean;
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<IProps, any> {
    _originalOnMouseMove: Function;
    _originalOnShowToolbar: Function;
    state = {
        videoMode: "gallery" as Mode,
    };

    _onCreateConference = async () => {
        this.setState({ joining: true });

        this.props.dispatch({ type: SET_PREJOIN_PAGE_VISIBILITY, value: false });
        //this.props.dispatch({ type: SET_NEW_MEETING_PAGE_VISIBILITY, value: false });

        const meetTokenCreator = await get8x8BetaJWT(localStorage.getItem("xNewToken") || "");

        if (meetTokenCreator?.room) {
            // By the time the Promise of appNavigate settles, this component
            // may have already been unmounted.
            const onAppNavigateSettled = () => /*this._mounted &&*/ this.setState({ joining: false });

            this.props.dispatch(appNavigate(meetTokenCreator.room)).then(onAppNavigateSettled, onAppNavigateSettled);
        }
    };

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
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        document.title = `${interfaceConfig.APP_NAME}`;
        this._start();

        window.addEventListener("beforeunload", this._handleBeforeUnload);
        PersistenceRegistry.register(
            "features/prejoin",
            {
                skipPrejoinOnReload: true,
                showPrejoin: false,
            },
            DEFAULT_STATE
        );
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        if (this.props._shouldDisplayTileView === prevProps._shouldDisplayTileView) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach((name) => document.removeEventListener(name, this._onFullScreenChange));

        window.removeEventListener("beforeunload", this._handleBeforeUnload);

        APP.conference.isJoined() && this.props.dispatch(hangup());
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
            return "";
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
        this.props.dispatch(hangup());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isAnyOverlayVisible,
            _layoutClassName,
            _notificationsVisible,
            _overflowDrawer,
            _showLobby,
            _showPrejoin,
            _showNewMeeting,
            t,
        } = this.props;
        const { videoMode } = this.state;

        if (_showNewMeeting) {
            return <CreateConference createConference={this._onCreateConference} />;
        }

        PersistenceRegistry.register(
            "features/prejoin",
            {
                skipPrejoinOnReload: true,
                showPrejoin: false,
            },
            DEFAULT_STATE
        );

        return (
            <div
                id="layout_wrapper"
                onMouseEnter={this._onMouseEnter}
                onMouseLeave={this._onMouseLeave}
                onMouseMove={this._onMouseMove}
                ref={this._setBackground}
            >
                <Chat />
                <div
                    // _layoutClassName has the styles to manage the side bar
                    className={_layoutClassName + " bg-gray-100"}
                    // className={"bg-gray-100 relative flex"}
                    id="videoconference_page"
                    onMouseMove={isMobileBrowser() ? undefined : this._onShowToolbar}
                >
                    <ConferenceInfo />
                    <Notice />
                    <div onTouchStart={this._onVidespaceTouchStart}>
                        <Header mode={videoMode} translate={t} onSetModeClicked={this._onSetVideoModeClicked} />
                        <div className="flex">
                            {/* <LargeVideoWeb /> */}
                            <VideoGalleryWrapper videoMode={videoMode} />
                        </div>
                        {_showPrejoin || _showLobby || (
                            <>
                                {/* <StageFilmstrip /> */}
                                {/*  <ScreenshareFilmstrip />*/}
                                {/* right screen tools component */}
                                {/* <MainFilmstrip /> */}
                            </>
                        )}
                    </div>

                    {_showPrejoin || _showLobby || (
                        <>
                            <span aria-level={1} className="sr-only" role="heading">
                                {t("toolbar.accessibilityLabel.heading") as string}
                            </span>
                            {/* <Toolbox /> */}
                        </>
                    )}
                    {/* CONFERENCE MEDIA CONTROLS */}
                    <ConferenceControlsWrapper />
                    {_notificationsVisible &&
                        !_isAnyOverlayVisible &&
                        (_overflowDrawer ? (
                            <JitsiPortal className="notification-portal">
                                {this.renderNotificationsContainer({ portal: true })}
                            </JitsiPortal>
                        ) : (
                            this.renderNotificationsContainer()
                        ))}

                    <CalleeInfoContainer />

                    {_showPrejoin && <Prejoin />}
                    {_showLobby && <LobbyScreen />}
                </div>
                <ParticipantsPane />
                <ReactionAnimations />
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

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach((name) => document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(init());

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
    const { backgroundAlpha, mouseMoveCallbackInterval } = state["features/base/config"];
    const { overflowDrawer } = state["features/toolbox"];
    const { showCreatingMeeting } = state["features/prejoin"];

    return {
        ...abstractMapStateToProps(state),
        _backgroundAlpha: backgroundAlpha,
        _isAnyOverlayVisible: Boolean(getOverlayToRender(state)),
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state) ?? ""],
        _mouseMoveCallbackInterval: mouseMoveCallbackInterval,
        _overflowDrawer: overflowDrawer,
        _roomName: getConferenceNameForTitle(state),
        _showLobby: getIsLobbyVisible(state),
        _showPrejoin: isPrejoinPageVisible(state),
        _showNewMeeting: showCreatingMeeting,
    };
}

export default translate(reactReduxConnect(_mapStateToProps)(Conference));
