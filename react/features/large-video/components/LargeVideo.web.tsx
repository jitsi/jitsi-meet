import React, { Component } from 'react';
import { connect } from 'react-redux';

// @ts-expect-error
import VideoLayout from '../../../../modules/UI/videolayout/VideoLayout';
import { IReduxState, IStore } from '../../app/types';
import { isDisplayNameVisible } from '../../base/config/functions.web';
import { VIDEO_TYPE } from '../../base/media/constants';
import { getLocalParticipant } from '../../base/participants/functions';
import Watermarks from '../../base/react/components/web/Watermarks';
import { getHideSelfView } from '../../base/settings/functions.any';
import { getVideoTrackByParticipant } from '../../base/tracks/functions.web';
import { setColorAlpha } from '../../base/util/helpers';
import { isSpotTV } from '../../base/util/spot';
import StageParticipantNameLabel from '../../display-name/components/web/StageParticipantNameLabel';
import { FILMSTRIP_BREAKPOINT } from '../../filmstrip/constants';
import { getVerticalViewMaxWidth, isFilmstripResizable } from '../../filmstrip/functions.web';
import SharedVideo from '../../shared-video/components/web/SharedVideo';
import Captions from '../../subtitles/components/web/Captions';
import { areClosedCaptionsEnabled } from '../../subtitles/functions.any';
import { setTileView } from '../../video-layout/actions.web';
import Whiteboard from '../../whiteboard/components/web/Whiteboard';
import { isWhiteboardEnabled } from '../../whiteboard/functions';
import { setSeeWhatIsBeingShared } from '../actions.web';
import { getLargeVideoParticipant } from '../functions';

import ScreenSharePlaceholder from './ScreenSharePlaceholder.web';


interface IProps {

    /**
     * The alpha(opacity) of the background.
     */
    _backgroundAlpha?: number;

    /**
     * The user selected background color.
     */
    _customBackgroundColor: string;

    /**
     * The user selected background image url.
     */
    _customBackgroundImageUrl: string;

    /**
     * Whether the screen-sharing placeholder should be displayed or not.
     */
    _displayScreenSharingPlaceholder: boolean;

    /**
     * Whether or not the hideSelfView is enabled.
     */
    _hideSelfView: boolean;

    /**
     * Prop that indicates whether the chat is open.
     */
    _isChatOpen: boolean;

    /**
     * Whether or not the display name is visible.
     */
    _isDisplayNameVisible: boolean;

    /**
     * Whether or not the local screen share is on large-video.
     */
    _isScreenSharing: boolean;

    /**
     * The large video participant id.
     */
    _largeVideoParticipantId: string;

    /**
     * Local Participant id.
     */
    _localParticipantId: string;

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    _noAutoPlayVideo: boolean;

    /**
     * Whether or not the filmstrip is resizable.
     */
    _resizableFilmstrip: boolean;

    /**
     * Whether or not the screen sharing is visible.
     */
    _seeWhatIsBeingShared: boolean;

    /**
     * Whether or not to show dominant speaker badge.
     */
    _showDominantSpeakerBadge: boolean;

    /**
     * Whether or not to show subtitles button.
     */
    _showSubtitles?: boolean;

    /**
     * The width of the vertical filmstrip (user resized).
     */
    _verticalFilmstripWidth?: number | null;

    /**
     * The max width of the vertical filmstrip.
     */
    _verticalViewMaxWidth: number;

    /**
     * Whether or not the filmstrip is visible.
     */
    _visibleFilmstrip: boolean;

    /**
     * Whether or not the whiteboard is ready to be used.
     */
    _whiteboardEnabled: boolean;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * The type of the React {@code Component} state of {@link LargeVideo}.
 */
interface IState {
    pan: {
        x: number;
        y: number;
    };
    scale: number;
}

/**

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class LargeVideo extends Component<IProps, IState> {
    _tappedTimeout: number | undefined;

    _containerRef: React.RefObject<HTMLDivElement>;

    _wrapperRef: React.RefObject<HTMLDivElement>;

    _panStart: { x: number; y: number; } = { x: 0, y: 0 };
    _initialPinchDistance = 0;

    _isPinching = false;
    _isPanning = false;
    _gestureStartPan = { x: 0, y: 0 };


    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            scale: 1,
            pan: { x: 0,
                y: 0 }
        };

        this._containerRef = React.createRef<HTMLDivElement>();
        this._wrapperRef = React.createRef<HTMLDivElement>();

        this._clearTapTimeout = this._clearTapTimeout.bind(this);
        this._updateLayout = this._updateLayout.bind(this);

        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);

        this._onWheel = this._onWheel.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    override componentDidMount() {
        this._containerRef.current?.addEventListener('wheel', this._onWheel, { passive: false });
    }

    override componentWillUnmount() {
        this._containerRef.current?.removeEventListener('wheel', this._onWheel);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const {
            _visibleFilmstrip,
            _isScreenSharing,
            _seeWhatIsBeingShared,
            _largeVideoParticipantId,
            _hideSelfView,
            _localParticipantId } = this.props;

        if (prevProps._visibleFilmstrip !== _visibleFilmstrip) {
            this._updateLayout();
        }

        if (prevProps._isScreenSharing !== _isScreenSharing && !_isScreenSharing) {
            this.props.dispatch(setSeeWhatIsBeingShared(false));
        }

        if (_isScreenSharing && _seeWhatIsBeingShared) {
            VideoLayout.updateLargeVideo(_largeVideoParticipantId, true, true);
        }

        if (_largeVideoParticipantId === _localParticipantId
            && prevProps._hideSelfView !== _hideSelfView) {
            VideoLayout.updateLargeVideo(_largeVideoParticipantId, true, false);
        }

        if (prevProps._largeVideoParticipantId !== _largeVideoParticipantId) {
            this.setState({
                scale: 1,
                pan: { x: 0,
                    y: 0 }
            });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    override render() {
        const {
            _displayScreenSharingPlaceholder,
            _isDisplayNameVisible,
            _noAutoPlayVideo,
            _showDominantSpeakerBadge,
            _whiteboardEnabled,
            _showSubtitles
        } = this.props;

        const { scale, pan } = this.state;
        const largeVideoWrapperStyle = {
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`
        };

        const style = this._getCustomStyles();
        const className = 'videocontainer';

        return (
            <div
                className = { className }
                id = 'largeVideoContainer'
                onMouseDown = { this._onMouseDown }
                onMouseLeave = { this._onMouseUp }
                onMouseMove = { this._onMouseMove }
                onMouseUp = { this._onMouseUp }
                onTouchEnd = { this._onTouchEnd }
                onTouchMove = { this._onTouchMove }
                onTouchStart = { this._onTouchStart }
                ref = { this._containerRef }
                style = { style }>
                <SharedVideo />
                {_whiteboardEnabled && <Whiteboard />}
                <div id = 'etherpad' />

                <Watermarks />

                <div
                    id = 'dominantSpeaker'>
                    <div className = 'dynamic-shadow' />
                    <div id = 'dominantSpeakerAvatarContainer' />
                </div>
                <div id = 'remotePresenceMessage' />
                <span id = 'remoteConnectionMessage' />
                <div id = 'largeVideoElementsContainer'>
                    <div id = 'largeVideoBackgroundContainer' />
                    {/*
                      * FIXME: the architecture of elements related to the large
                      * video and the naming. The background is not part of
                      * largeVideoWrapper because we are controlling the size of
                      * the video through largeVideoWrapper. That's why we need
                      * another container for the background and the
                      * largeVideoWrapper in order to hide/show them.
                      */}
                    { _displayScreenSharingPlaceholder ? <ScreenSharePlaceholder /> : <></>}
                    <div
                        id = 'largeVideoWrapper'
                        ref = { this._wrapperRef }
                        role = 'figure'
                        style = { largeVideoWrapperStyle }>
                        <video
                            autoPlay = { !_noAutoPlayVideo }
                            id = 'largeVideo'
                            muted = { true }
                            playsInline = { true } /* for Safari on iOS to work */ />
                    </div>
                </div>
                { (!interfaceConfig.DISABLE_TRANSCRIPTION_SUBTITLES && _showSubtitles)
                    && <Captions /> }
                {
                    _isDisplayNameVisible
                    && (
                        _showDominantSpeakerBadge && <StageParticipantNameLabel />
                    )
                }
            </div>
        );
    }

    /**
     * Refreshes the video layout to determine the dimensions of the stage view.
     * If the filmstrip is toggled it adds CSS transition classes and removes them
     * when the transition is done.
     *
     * @returns {void}
     */
    _updateLayout() {
        const { _verticalFilmstripWidth, _resizableFilmstrip } = this.props;

        if (_resizableFilmstrip && Number(_verticalFilmstripWidth) >= FILMSTRIP_BREAKPOINT) {
            this._containerRef.current?.classList.add('transition');
            this._wrapperRef.current?.classList.add('transition');
            VideoLayout.refreshLayout();

            setTimeout(() => {
                this._containerRef?.current && this._containerRef.current.classList.remove('transition');
                this._wrapperRef?.current && this._wrapperRef.current.classList.remove('transition');
            }, 1000);
        } else {
            VideoLayout.refreshLayout();
        }
    }

    /**
     * Clears the '_tappedTimout'.
     *
     * @private
     * @returns {void}
     */
    _clearTapTimeout() {
        clearTimeout(this._tappedTimeout);
        this._tappedTimeout = undefined;
    }

    /**
     * Creates the custom styles object.
     *
     * @private
     * @returns {Object}
     */
    _getCustomStyles() {
        const styles: any = {};
        const {
            _customBackgroundColor,
            _customBackgroundImageUrl,
            _verticalFilmstripWidth,
            _verticalViewMaxWidth,
            _visibleFilmstrip
        } = this.props;

        styles.background = _customBackgroundColor || interfaceConfig.DEFAULT_BACKGROUND;

        if (this.props._backgroundAlpha !== undefined) {
            const alphaColor = setColorAlpha(styles.backgroundColor, this.props._backgroundAlpha);

            styles.background = alphaColor;
        }

        if (_customBackgroundImageUrl) {
            styles.backgroundImage = `url(${_customBackgroundImageUrl})`;
            styles.backgroundSize = 'cover';
        }

        if (_visibleFilmstrip && Number(_verticalFilmstripWidth) >= FILMSTRIP_BREAKPOINT) {
            styles.width = `calc(100% - ${_verticalViewMaxWidth || 0}px)`;
        }

        return styles;
    }

    /**
     * Helper function to calculate distance between two touch points.
     *
     * @param {TouchList} touches - The touches list.
     * @private
     * @returns {number}
     */
    _getPinchDistance(touches: React.TouchEvent['touches']) {
        return Math.sqrt(
            ((touches[0].clientX - touches[1].clientX) ** 2)
            + ((touches[0].clientY - touches[1].clientY) ** 2)
        );
    }

    /**
     * Helper function to calculate the midpoint between two touch points.
     *
     * @param {TouchList} touches - The touches list.
     * @private
     * @returns {{ x: number, y: number; }}
     */
    _getPinchMidpoint(touches: React.TouchEvent['touches']) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    /**
     * Handles the start of a touch gesture.
     *
     * @param {React.TouchEvent} e - The touch event.
     * @private
     * @returns {void}
     */
    _onTouchStart(e: React.TouchEvent) {
        const { scale } = this.state;

        if (e.touches.length === 2) {
            e.preventDefault();
            this._isPinching = true;
            this._isPanning = false;
            this._initialPinchDistance = this._getPinchDistance(e.touches);
            this._panStart = this._getPinchMidpoint(e.touches);
            this._gestureStartPan = { ...this.state.pan };
        } else if (e.touches.length === 1 && scale > 1) {
            e.preventDefault();
            this._isPanning = true;
            this._isPinching = false;
            this._panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this._gestureStartPan = { ...this.state.pan };
        }
    }

    /**
     * Handles movement during a touch gesture for zoom and pan.
     *
     * @param {React.TouchEvent} e - The touch event.
     * @private
     * @returns {void}
     */
    _onTouchMove(e: React.TouchEvent) {

        if (this._isPinching && e.touches.length === 2) {
            e.preventDefault();

            const newPinchDistance = this._getPinchDistance(e.touches);
            let newScale = this.state.scale * (newPinchDistance / this._initialPinchDistance);

            newScale = Math.max(1, Math.min(newScale, 5)); // Clamp scale

            const newMidpoint = this._getPinchMidpoint(e.touches);
            const panX = this._gestureStartPan.x + (newMidpoint.x - this._panStart.x);
            const panY = this._gestureStartPan.y + (newMidpoint.y - this._panStart.y);

            if (this._wrapperRef.current) {
                this._wrapperRef.current.style.transform = `scale(${newScale}) translate(${panX}px, ${panY}px)`;
            }

        } else if (this._isPanning && e.touches.length === 1) {
            e.preventDefault();

            const currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            const panX = this._gestureStartPan.x + (currentPos.x - this._panStart.x);
            const panY = this._gestureStartPan.y + (currentPos.y - this._panStart.y);

            if (this._wrapperRef.current) {
                this._wrapperRef.current.style.transform = `scale(${this.state.scale}) translate(${panX}px, ${panY}px)`;
            }
        }
    }

    /**
 * Handles the end of a touch gesture.
 *
 * @param {React.TouchEvent} e - The touch event.
 * @private
 * @returns {void}
 */
    _onTouchEnd(e: React.TouchEvent) {
        const wasGesture = this._isPinching || this._isPanning;

        this._isPinching = false;
        this._isPanning = false;

        if (wasGesture) {
            const wrapper = this._wrapperRef.current;
            const container = this._containerRef.current;

            if (!wrapper || !container) {
                return;
            }

            const transform = wrapper.style.transform;
            const scaleMatch = transform.match(/scale\(([^)]+)\)/);
            const translateMatch = transform.match(/translate\(([^)]+)\)/);

            if (!scaleMatch || !translateMatch) {
                return;
            }

            let finalScale = parseFloat(scaleMatch[1]);
            const [ finalPanX, finalPanY ] = translateMatch[1].replace(/px/g, '').split(', ').map(p => parseFloat(p));
            let finalPan = { x: finalPanX, y: finalPanY };

            finalScale = Math.max(1, Math.min(finalScale, 5));

            if (finalScale <= 1) {
                finalPan = { x: 0, y: 0 };
            } else {
                const { clientWidth, clientHeight } = container;
                const maxPanX = (clientWidth * finalScale - clientWidth) / 2;
                const maxPanY = (clientHeight * finalScale - clientHeight) / 2;

                finalPan = {
                    x: Math.max(-maxPanX, Math.min(finalPan.x, maxPanX)),
                    y: Math.max(-maxPanY, Math.min(finalPan.y, maxPanY))
                };
            }

            this.setState({
                scale: finalScale,
                pan: finalPan
            });

            return;
        }

        if (e.changedTouches.length === 1) {
            e.stopPropagation();
            e.preventDefault();

            if (this._tappedTimeout) {
                this._clearTapTimeout();
                this.props.dispatch(setTileView(true));
            } else {
                this._tappedTimeout = window.setTimeout(this._clearTapTimeout, 300);
            }
        }
    }

    /**
 * Handles the mouse wheel event for zooming on desktop.
 *
 * @param {WheelEvent} e - The wheel event.
 * @private
 * @returns {void}
 */
    _onWheel(e: WheelEvent) {
        e.preventDefault();
        e.stopPropagation();

        const scaleChange = e.deltaY * -0.01;
        let newScale = this.state.scale + scaleChange;

        newScale = Math.max(1, Math.min(newScale, 5));

        let newPan = this.state.pan;

        if (newScale <= 1) {
            newPan = { x: 0, y: 0 };
        }

        this.setState({
            scale: newScale,
            pan: newPan
        });
    }

    /**
 * Handles the mouse down event to initiate panning when zoomed in.
 *
 * @param {React.MouseEvent} e - The mouse event.
 * @private
 * @returns {void}
 */
    _onMouseDown(e: React.MouseEvent) {
        if (e.button !== 0 || this.state.scale <= 1) {
            return;
        }

        e.preventDefault();
        this._isPanning = true;
        this._panStart = { x: e.clientX, y: e.clientY };
        this._gestureStartPan = { ...this.state.pan };
    }

    /**
 * Handles the mouse move event to pan the video.
 *
 * @param {React.MouseEvent} e - The mouse event.
 * @private
 * @returns {void}
 */
    _onMouseMove(e: React.MouseEvent) {
        if (!this._isPanning) {
            return;
        }

        e.preventDefault();
        const panX = this._gestureStartPan.x + (e.clientX - this._panStart.x);
        const panY = this._gestureStartPan.y + (e.clientY - this._panStart.y);

        if (this._wrapperRef.current) {
            this._wrapperRef.current.style.transform = `scale(${this.state.scale}) translate(${panX}px, ${panY}px)`;
        }
    }

    /**
 * Handles the mouse up or leave event to end panning.
 *
 * @param {React.MouseEvent} e - The mouse event.
 * @private
 * @returns {void}
 */
    _onMouseUp() {
        if (!this._isPanning) {
            return;
        }

        this._isPanning = false;

        const wrapper = this._wrapperRef.current;
        const container = this._containerRef.current;

        if (!wrapper || !container) {
            return;
        }

        const transform = wrapper.style.transform;
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        const translateMatch = transform.match(/translate\(([^)]+)\)/);

        if (!scaleMatch || !translateMatch) {
            return;
        }

        const finalScale = parseFloat(scaleMatch[1]);
        const [ finalPanX, finalPanY ] = translateMatch[1].replace(/px/g, '').split(', ').map(p => parseFloat(p));
        let finalPan = { x: finalPanX, y: finalPanY };

        if (finalScale <= 1) {
            finalPan = { x: 0, y: 0 };
        } else {
            const { clientWidth, clientHeight } = container;
            const maxPanX = (clientWidth * finalScale - clientWidth) / 2;
            const maxPanY = (clientHeight * finalScale - clientHeight) / 2;

            finalPan = {
                x: Math.max(-maxPanX, Math.min(finalPan.x, maxPanX)),
                y: Math.max(-maxPanY, Math.min(finalPan.y, maxPanY))
            };
        }

        this.setState({
            scale: finalScale,
            pan: finalPan
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const testingConfig = state['features/base/config'].testing;
    const { backgroundColor, backgroundImageUrl } = state['features/dynamic-branding'];
    const { isOpen: isChatOpen } = state['features/chat'];
    const { width: verticalFilmstripWidth, visible } = state['features/filmstrip'];
    const { hideDominantSpeakerBadge } = state['features/base/config'];
    const { seeWhatIsBeingShared } = state['features/large-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const videoTrack = getVideoTrackByParticipant(state, largeVideoParticipant);
    const isLocalScreenshareOnLargeVideo = largeVideoParticipant?.id?.includes(localParticipantId ?? '')
        && videoTrack?.videoType === VIDEO_TYPE.DESKTOP;

    return {
        _backgroundAlpha: state['features/base/config'].backgroundAlpha,
        _customBackgroundColor: backgroundColor,
        _customBackgroundImageUrl: backgroundImageUrl,
        _displayScreenSharingPlaceholder:
            Boolean(isLocalScreenshareOnLargeVideo && !seeWhatIsBeingShared && !isSpotTV(state)),
        _hideSelfView: getHideSelfView(state),
        _isChatOpen: isChatOpen,
        _isDisplayNameVisible: isDisplayNameVisible(state),
        _isScreenSharing: Boolean(isLocalScreenshareOnLargeVideo),
        _largeVideoParticipantId: largeVideoParticipant?.id ?? '',
        _localParticipantId: localParticipantId ?? '',
        _noAutoPlayVideo: Boolean(testingConfig?.noAutoPlayVideo),
        _resizableFilmstrip: isFilmstripResizable(state),
        _seeWhatIsBeingShared: Boolean(seeWhatIsBeingShared),
        _showDominantSpeakerBadge: !hideDominantSpeakerBadge,
        _showSubtitles: areClosedCaptionsEnabled(state)
            && Boolean(state['features/base/settings'].showSubtitlesOnStage),
        _verticalFilmstripWidth: verticalFilmstripWidth.current,
        _verticalViewMaxWidth: getVerticalViewMaxWidth(state),
        _visibleFilmstrip: visible,
        _whiteboardEnabled: isWhiteboardEnabled(state)
    };
}

export default connect(_mapStateToProps)(LargeVideo);
