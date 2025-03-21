import _ from "lodash";
import React from "react";
import { WithTranslation } from "react-i18next";
import { connect as reactReduxConnect } from "react-redux";

// @ts-ignore
import { IReduxState } from "../../../../../app/types";
import Chat from "../../../../../chat/components/web/Chat";
import { init } from "../../../../../conference/actions.web";
import type { AbstractProps } from "../../../../../conference/components/AbstractConference";
import { AbstractConference, abstractMapStateToProps } from "../../../../../conference/components/AbstractConference";
import { maybeShowSuboptimalExperienceNotification } from "../../../../../conference/functions.web";
import CalleeInfoContainer from "../../../../../invite/components/callee-info/CalleeInfoContainer";
import LobbyScreen from "../../../../../lobby/components/web/LobbyScreen";
import { getIsLobbyVisible } from "../../../../../lobby/functions";
import { getOverlayToRender } from "../../../../../overlay/functions.web";
import ParticipantsPane from "../../../../../participants-pane/components/web/ParticipantsPane";
import Prejoin from "../../../../../prejoin/components/web/Prejoin";
import { isPrejoinPageVisible } from "../../../../../prejoin/functions";
import ReactionAnimations from "../../../../../reactions/components/web/ReactionsAnimations";
import { toggleToolboxVisible } from "../../../../../toolbox/actions.any";
import { fullScreenChanged, showToolbox } from "../../../../../toolbox/actions.web";
import JitsiPortal from "../../../../../toolbox/components/web/JitsiPortal";
import { LAYOUT_CLASSNAMES } from "../../../../../video-layout/constants";
import { getCurrentLayout } from "../../../../../video-layout/functions.any";
import { getConferenceNameForTitle } from "../../../../conference/functions";
import { isMobileBrowser } from "../../../../environment/utils";
import { translate } from "../../../../i18n/functions";

import ConferenceInfo from "../../../../../conference/components/web/ConferenceInfo";
import { default as Notice } from "../../../../../conference/components/web/Notice";
import Header, { Mode } from "../components/Header";

import ConferenceControlsWrapper from "../containers/ConferenceControlsWrapper";
import VideoGalleryWrapper from "../containers/VideoGalleryWrapper";
import { DEFAULT_STATE } from "../../../../known-domains/reducer";
import PersistenceRegistry from "../../../../redux/PersistenceRegistry";

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
    }

    componentDidMount() {
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
            t,
        } = this.props;
        const { videoMode } = this.state;

        return (
            <>
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
            </>
        );
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
    const { mouseMoveCallbackInterval } = state["features/base/config"];
    const { overflowDrawer } = state["features/toolbox"];

    return {
        ...abstractMapStateToProps(state),
        _isAnyOverlayVisible: Boolean(getOverlayToRender(state)),
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state) ?? ""],
        _mouseMoveCallbackInterval: mouseMoveCallbackInterval,
        _overflowDrawer: overflowDrawer,
        _roomName: getConferenceNameForTitle(state),
        _showLobby: getIsLobbyVisible(state),
        _showPrejoin: isPrejoinPageVisible(state),
    };
}

export default translate(reactReduxConnect(_mapStateToProps)(Conference));
