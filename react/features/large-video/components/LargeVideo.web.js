// @flow

import React, { Component } from 'react';

import VideoLayout from '../../../../modules/UI/videolayout/VideoLayout';
import { getParticipantById } from '../../base/participants';
import { Watermarks } from '../../base/react';
import { connect } from '../../base/redux';
import { setColorAlpha } from '../../base/util';
import { StageParticipantNameLabel } from '../../display-name';
import { FILMSTRIP_BREAKPOINT, isFilmstripResizable } from '../../filmstrip';
import { getVerticalViewMaxWidth } from '../../filmstrip/functions.web';
import { SharedIFrame } from '../../shared-iframe/components';
import { SharedVideo } from '../../shared-video/components/web';
import { VIDEO_PLAYER_PARTICIPANT_NAME, YOUTUBE_PLAYER_PARTICIPANT_NAME } from '../../shared-video/constants';
import { Captions } from '../../subtitles/';
import { setTileView } from '../../video-layout/actions';

declare var interfaceConfig: Object;

type Props = {

    /**
     * The alpha(opacity) of the background.
     */
    _backgroundAlpha: number,

    /**
     * The user selected background color.
     */
    _customBackgroundColor: string,

    /**
     * The user selected background image url.
     */
    _customBackgroundImageUrl: string,

    /**
     * Prop that indicates whether the chat is open.
     */
    _isChatOpen: boolean,

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    _noAutoPlayVideo: boolean,

    /**
     * Whether or not the filmstrip is resizable.
     */
    _resizableFilmstrip: boolean,

    /**
     * Whether or not to show dominant speaker badge.
     */
    _showDominantSpeakerBadge: boolean,

    /**
     * The width of the vertical filmstrip (user resized).
     */
    _verticalFilmstripWidth: ?number,

    /**
     * The max width of the vertical filmstrip.
     */
    _verticalViewMaxWidth: number,

    /**
     * Whether or not the filmstrip is visible.
     */
    _visibleFilmstrip: boolean,

    /**
     * True if the participant which this component represents is fake.
     *
     * @private
     */
    _isFakeParticipant: boolean,

    /**
     * The If of the participant (to be) depicted by {@link LargeVideo}.
     *
     * @public
     */
     _participantId: string,

    /**
     * The Name of the participant (to be) depicted by {@link LargeVideo}.
     *
     * @public
     */
     _participantName: string,

    /**
     * Whether the current participant is an IFrame Participant.
     *
     * @private
     */
     _isIFrameParticipant: string,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class LargeVideo extends Component<Props> {
    _tappedTimeout: ?TimeoutID;

    _containerRef: Object;

    _wrapperRef: Object;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._containerRef = React.createRef();
        this._wrapperRef = React.createRef();

        this._clearTapTimeout = this._clearTapTimeout.bind(this);
        this._onDoubleTap = this._onDoubleTap.bind(this);
        this._updateLayout = this._updateLayout.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        const { _visibleFilmstrip } = this.props;

        if (prevProps._visibleFilmstrip !== _visibleFilmstrip) {
            this._updateLayout();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const {
            _isChatOpen,
            _noAutoPlayVideo,
            _isFakeParticipant,
            _participantId,
            _participantName,
            _isIFrameParticipant,
            _showDominantSpeakerBadge
        } = this.props;
        const style = this._getCustomSyles();
        const className = `videocontainer${_isChatOpen ? ' shift-right' : ''}`;

        const renderSharedVideo = _isFakeParticipant
            && (
                _participantName === VIDEO_PLAYER_PARTICIPANT_NAME
                || _participantName === YOUTUBE_PLAYER_PARTICIPANT_NAME);
        const renderSharedIFrame = _isFakeParticipant
            && _isIFrameParticipant;

        const speakerStyle = {
            display: renderSharedIFrame || renderSharedVideo ? 'none' : 'block'
        };

        return (
            <div
                className = { className }
                id = 'largeVideoContainer'
                ref = { this._containerRef }
                style = { style }>
                { renderSharedVideo && <SharedVideo /> }
                <SharedIFrame shareUrl = { _participantId } />

                <div id = 'etherpad' />

                { !renderSharedIFrame && <Watermarks /> }

                <div
                    id = 'dominantSpeaker'
                    onTouchEnd = { this._onDoubleTap }
                    style = { speakerStyle }>
                    <div className = 'dynamic-shadow' />
                    <div id = 'dominantSpeakerAvatarContainer' />
                </div>
                <div id = 'remotePresenceMessage' />
                <span id = 'remoteConnectionMessage' />
                <div
                    id = 'largeVideoElementsContainer'
                    style = { speakerStyle }>
                    <div id = 'largeVideoBackgroundContainer' />

                    {/*
                      * FIXME: the architecture of elements related to the large
                      * video and the naming. The background is not part of
                      * largeVideoWrapper because we are controlling the size of
                      * the video through largeVideoWrapper. That's why we need
                      * another container for the background and the
                      * largeVideoWrapper in order to hide/show them.
                      */}
                    <div
                        id = 'largeVideoWrapper'
                        onTouchEnd = { this._onDoubleTap }
                        ref = { this._wrapperRef }
                        role = 'figure'
                        style = { speakerStyle } >
                        <video
                            autoPlay = { !_noAutoPlayVideo }
                            id = 'largeVideo'
                            muted = { true }
                            playsInline = { true } /* for Safari on iOS to work */ />
                    </div>
                </div>
                { interfaceConfig.DISABLE_TRANSCRIPTION_SUBTITLES
                    || <Captions /> }
                {_showDominantSpeakerBadge && <StageParticipantNameLabel />}
            </div>
        );
    }

    _updateLayout: () => void;

    /**
     * Refreshes the video layout to determine the dimensions of the stage view.
     * If the filmstrip is toggled it adds CSS transition classes and removes them
     * when the transition is done.
     *
     * @returns {void}
     */
    _updateLayout() {
        const { _verticalFilmstripWidth, _resizableFilmstrip } = this.props;

        if (_resizableFilmstrip && _verticalFilmstripWidth >= FILMSTRIP_BREAKPOINT) {
            this._containerRef.current.classList.add('transition');
            this._wrapperRef.current.classList.add('transition');
            VideoLayout.refreshLayout();

            setTimeout(() => {
                this._containerRef.current && this._containerRef.current.classList.remove('transition');
                this._wrapperRef.current && this._wrapperRef.current.classList.remove('transition');
            }, 1000);
        } else {
            VideoLayout.refreshLayout();
        }
    }

    _clearTapTimeout: () => void;

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
    _getCustomSyles() {
        const styles = {};
        const {
            _customBackgroundColor,
            _customBackgroundImageUrl,
            _verticalFilmstripWidth,
            _verticalViewMaxWidth,
            _visibleFilmstrip
        } = this.props;

        styles.backgroundColor = _customBackgroundColor || interfaceConfig.DEFAULT_BACKGROUND;

        if (this.props._backgroundAlpha !== undefined) {
            const alphaColor = setColorAlpha(styles.backgroundColor, this.props._backgroundAlpha);

            styles.backgroundColor = alphaColor;
        }

        if (_customBackgroundImageUrl) {
            styles.backgroundImage = `url(${_customBackgroundImageUrl})`;
            styles.backgroundSize = 'cover';
        }

        if (_visibleFilmstrip && _verticalFilmstripWidth >= FILMSTRIP_BREAKPOINT) {
            styles.width = `calc(100% - ${_verticalViewMaxWidth || 0}px)`;
        }

        return styles;
    }

    _onDoubleTap: () => void;

    /**
     * Sets view to tile view on double tap.
     *
     * @param {Object} e - The event.
     * @private
     * @returns {void}
     */
    _onDoubleTap(e) {
        e.stopPropagation();
        e.preventDefault();

        if (this._tappedTimeout) {
            this._clearTapTimeout();
            this.props.dispatch(setTileView(true));
        } else {
            this._tappedTimeout = setTimeout(this._clearTapTimeout, 300);
        }
    }
}


/**
 * Maps (parts of) the Redux state to the associated LargeVideo props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const testingConfig = state['features/base/config'].testing;
    const { backgroundColor, backgroundImageUrl } = state['features/dynamic-branding'];
    const { isOpen: isChatOpen } = state['features/chat'];
    const { width: verticalFilmstripWidth, visible } = state['features/filmstrip'];
    const { participantId } = state['features/large-video'];
    const participant = getParticipantById(state, participantId);
    const { hideDominantSpeakerBadge } = state['features/base/config'];
    const { sharedIFrameConfig } = state['features/base/config'];

    return {
        _backgroundAlpha: state['features/base/config'].backgroundAlpha,
        _customBackgroundColor: backgroundColor,
        _customBackgroundImageUrl: backgroundImageUrl,
        _isChatOpen: isChatOpen,
        _noAutoPlayVideo: testingConfig?.noAutoPlayVideo,
        _resizableFilmstrip: isFilmstripResizable(state),
        _showDominantSpeakerBadge: !hideDominantSpeakerBadge,
        _verticalFilmstripWidth: verticalFilmstripWidth.current,
        _visibleFilmstrip: visible,
        _participantId: participantId,
        _participantName: participant && participant.name,
        _isIFrameParticipant: Object.keys(sharedIFrameConfig || {}).includes(participant && participant.name),
        _isFakeParticipant: participant && participant.isFakeParticipant,
        _verticalViewMaxWidth: getVerticalViewMaxWidth(state)
    };
}

export default connect(_mapStateToProps)(LargeVideo);
