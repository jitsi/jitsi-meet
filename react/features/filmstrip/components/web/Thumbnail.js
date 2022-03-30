// @flow

import { withStyles } from '@material-ui/styles';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import React, { Component } from 'react';

import { createScreenSharingIssueEvent, sendAnalytics } from '../../../analytics';
import { Avatar } from '../../../base/avatar';
import { isMobileBrowser } from '../../../base/environment/utils';
import { MEDIA_TYPE, VideoTrack } from '../../../base/media';
import {
    getParticipantByIdOrUndefined,
    hasRaisedHand,
    pinParticipant
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { isTestModeEnabled } from '../../../base/testing';
import {
    getLocalAudioTrack,
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    updateLastTrackVideoMediaEvent
} from '../../../base/tracks';
import { getVideoObjectPosition } from '../../../face-centering/functions';
import { hideGif, showGif } from '../../../gifs/actions';
import { getGifDisplayMode, getGifForParticipant } from '../../../gifs/functions';
import { PresenceLabel } from '../../../presence-status';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';
import { addStageParticipant } from '../../actions.web';
import {
    DISPLAY_MODE_TO_CLASS_NAME,
    DISPLAY_VIDEO,
    SHOW_TOOLBAR_CONTEXT_MENU_AFTER,
    VIDEO_TEST_EVENTS
} from '../../constants';
import {
    computeDisplayModeFromInput,
    getActiveParticipantsIds,
    getDisplayModeInput,
    isVideoPlayable,
    showGridInVerticalView
} from '../../functions';
import { isStageFilmstripEnabled } from '../../functions.web';

import ThumbnailAudioIndicator from './ThumbnailAudioIndicator';
import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} state of {@link Thumbnail}.
 */
export type State = {|

    /**
     * Indicates that the canplay event has been received.
     */
    canPlayEventReceived: boolean,

    /**
     * The current display mode of the thumbnail.
     */
    displayMode: number,

    /**
     * Whether popover is visible or not.
     */
    popoverVisible: boolean,

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean
|};

/**
 * The type of the React {@code Component} props of {@link Thumbnail}.
 */
export type Props = {|

    /**
     * The audio track related to the participant.
     */
    _audioTrack: ?Object,

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * Indicates whether the local video flip feature is disabled or not.
     */
    _disableLocalVideoFlip: boolean,

    /**
     * Indicates whether enlargement of tiles to fill the available space is disabled.
     */
    _disableTileEnlargement: boolean,

    /**
     * URL of GIF sent by this participant, null if there's none.
     */
    _gifSrc ?: string,

    /**
     * The height of the Thumbnail.
     */
    _height: number,

    /**
     * Whether or not the participant is displayed on the stage filmstrip.
     * Used to hide the video from the vertical filmstrip.
     */
    _isActiveParticipant: boolean,

    /**
     * Indicates whether the thumbnail should be hidden or not.
     */
    _isHidden: boolean,

    /**
     * Indicates whether audio only mode is enabled.
     */
    _isAudioOnly: boolean,

    /**
     * Indicates whether the participant associated with the thumbnail is displayed on the large video.
     */
    _isCurrentlyOnLargeVideo: boolean,

    /**
     * Whether we are currently running in a mobile browser.
     */
    _isMobile: boolean,

    /**
     * Whether we are currently running in a mobile browser in portrait orientation.
     */
    _isMobilePortrait: boolean,

    /**
     * Indicates whether the participant is screen sharing.
     */
    _isScreenSharing: boolean,

    /**
     * Indicates whether the video associated with the thumbnail is playable.
     */
    _isVideoPlayable: boolean,

    /**
     * Disable/enable the dominant speaker indicator.
     */
    _isDominantSpeakerDisabled: boolean,

    /**
     * Indicates whether testing mode is enabled.
     */
    _isTestModeEnabled: boolean,

    /**
     * The current local video flip setting.
     */
    _localFlipX: boolean,

    /**
     * An object with information about the participant related to the thumbnail.
     */
    _participant: Object,

    /**
     * Whether or not the participant has the hand raised.
     */
    _raisedHand: boolean,

    /**
     * Whether or not the stage filmstrip is disabled.
     */
    _stageFilmstripDisabled: boolean,

    /**
     * The video object position for the participant.
     */
    _videoObjectPosition: string,

    /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack: ?Object,

    /**
     * The width of the thumbnail.
     */
    _width: number,

    /**
     * An object containing CSS classes.
     */
    classes: Object,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * The horizontal offset in px for the thumbnail. Used to center the thumbnails from the last row in tile view.
     */
    horizontalOffset: number,

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID: ?string,

    /**
     * Whether the tile is displayed in the stage filmstrip or not.
     */
    stageFilmstrip: boolean,

    /**
     * Styles that will be set to the Thumbnail's main span element.
     */
    style?: ?Object
|};

const defaultStyles = theme => {
    return {
        indicatorsContainer: {
            position: 'absolute',
            padding: `${theme.spacing(1)}px`,
            zIndex: 10,
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            left: 0,

            '&.tile-view-mode': {
                padding: `${theme.spacing(2)}px`
            }
        },

        indicatorsTopContainer: {
            top: 0,
            justifyContent: 'space-between'
        },

        indicatorsBottomContainer: {
            bottom: 0
        },

        indicatorsBackground: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '100%',
            overflow: 'hidden',

            '&:not(:empty)': {
                padding: '2px'
            },

            '& > *:not(:last-child)': {
                marginRight: '4px'
            },

            '&:not(.top-indicators) > span:last-child': {
                marginRight: '6px'
            }
        },

        containerBackground: {
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            borderRadius: '4px',
            backgroundColor: theme.palette.ui02
        },

        borderIndicator: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 9,
            borderRadius: '4px'
        },

        borderIndicatorOnTop: {
            zIndex: 11
        },

        activeSpeaker: {
            '& .active-speaker-indicator': {
                boxShadow: `inset 0px 0px 0px 4px ${theme.palette.link01Active} !important`
            }
        },

        raisedHand: {
            '& .raised-hand-border': {
                boxShadow: `inset 0px 0px 0px 2px ${theme.palette.warning02} !important`
            }
        },

        gif: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 11,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: theme.palette.ui02,

            '& img': {
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                flexGrow: '1'
            }
        }
    };
};

/**
 * Implements a thumbnail.
 *
 * @augments Component
 */
class Thumbnail extends Component<Props, State> {
    /**
     * The long touch setTimeout handler.
     */
    timeoutHandle: Object;

    /**
     * Timeout used to detect double tapping.
     * It is active while user has tapped once.
     */
    _firstTap: ?TimeoutID;

    /**
     * Initializes a new Thumbnail instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        const state = {
            canPlayEventReceived: false,
            displayMode: DISPLAY_VIDEO,
            popoverVisible: false,
            isHovered: false
        };

        this.state = {
            ...state,
            displayMode: computeDisplayModeFromInput(getDisplayModeInput(props, state))
        };
        this.timeoutHandle = null;

        this._clearDoubleClickTimeout = this._clearDoubleClickTimeout.bind(this);
        this._onCanPlay = this._onCanPlay.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseMove = debounce(this._onMouseMove.bind(this), 100, {
            leading: true,
            trailing: false
        });
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onTestingEvent = this._onTestingEvent.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._showPopover = this._showPopover.bind(this);
        this._hidePopover = this._hidePopover.bind(this);
        this._onGifMouseEnter = this._onGifMouseEnter.bind(this);
        this._onGifMouseLeave = this._onGifMouseLeave.bind(this);
    }

    /**
     * Starts listening for audio level updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._onDisplayModeChanged();
    }

    /**
     * Stops listening for audio level updates on the old track and starts
     * listening instead on the new track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevState.displayMode !== this.state.displayMode) {
            this._onDisplayModeChanged();
        }
    }

    /**
     * Handles display mode changes.
     *
     * @returns {void}
     */
    _onDisplayModeChanged() {
        const input = getDisplayModeInput(this.props, this.state);

        this._maybeSendScreenSharingIssueEvents(input);
    }

    /**
     * Sends screen sharing issue event if an issue is detected.
     *
     * @param {Object} input - The input used to compute the thumbnail display mode.
     * @returns {void}
     */
    _maybeSendScreenSharingIssueEvents(input) {
        const {
            _currentLayout,
            _isAudioOnly,
            _isScreenSharing
        } = this.props;
        const { displayMode } = this.state;
        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;

        if (!(DISPLAY_VIDEO === displayMode)
            && tileViewActive
            && _isScreenSharing
            && !_isAudioOnly) {
            sendAnalytics(createScreenSharingIssueEvent({
                source: 'thumbnail',
                ...input
            }));
        }
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, prevState: State) {
        if (!props._videoTrack && prevState.canPlayEventReceived) {
            const newState = {
                ...prevState,
                canPlayEventReceived: false
            };

            return {
                ...newState,
                displayMode: computeDisplayModeFromInput(getDisplayModeInput(props, newState))
            };
        }

        const newDisplayMode = computeDisplayModeFromInput(getDisplayModeInput(props, prevState));

        if (newDisplayMode !== prevState.displayMode) {
            return {
                ...prevState,
                displayMode: newDisplayMode
            };
        }

        return null;
    }

    _clearDoubleClickTimeout: () => void;

    /**
     * Clears the first click timeout.
     *
     * @returns {void}
     */
    _clearDoubleClickTimeout() {
        clearTimeout(this._firstTap);
        this._firstTap = undefined;
    }

    _showPopover: () => void;

    /**
     * Shows popover.
     *
     * @private
     * @returns {void}
     */
    _showPopover() {
        this.setState({
            popoverVisible: true
        });
    }

    _hidePopover: () => void;

    /**
     * Hides popover.
     *
     * @private
     * @returns {void}
     */
    _hidePopover() {
        const { _currentLayout } = this.props;

        if (_currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW) {
            this.setState({
                isHovered: false
            });
        }
        this.setState({
            popoverVisible: false
        });
    }

    /**
     * Returns an object with the styles for thumbnail.
     *
     * @returns {Object} - The styles for the thumbnail.
     */
    _getStyles(): Object {
        const { canPlayEventReceived } = this.state;
        const {
            _currentLayout,
            _disableTileEnlargement,
            _height,
            _isHidden,
            _isScreenSharing,
            _participant,
            _videoObjectPosition,
            _videoTrack,
            _width,
            horizontalOffset,
            style
        } = this.props;

        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const track = jitsiVideoTrack?.track;
        const isPortraitVideo = ((track && track.getSettings()?.aspectRatio) || 1) < 1;

        let styles: {
            avatar: Object,
            thumbnail: Object,
            video: Object
        } = {
            thumbnail: {},
            avatar: {},
            video: {}
        };

        const avatarSize = Math.min(_height / 2, _width - 30);
        let { left } = style || {};

        if (typeof left === 'number' && horizontalOffset) {
            left += horizontalOffset;
        }

        let videoStyles = null;
        const doNotStretchVideo = (isPortraitVideo && tileViewActive)
            || _disableTileEnlargement
            || _isScreenSharing;

        if (canPlayEventReceived || _participant.local) {
            videoStyles = {
                objectFit: doNotStretchVideo ? 'contain' : 'cover'
            };
        } else {
            videoStyles = {
                display: 'none'
            };
        }

        if (videoStyles.objectFit === 'cover') {
            videoStyles.objectPosition = _videoObjectPosition;
        }

        styles = {
            thumbnail: {
                ...style,
                left,
                height: `${_height}px`,
                minHeight: `${_height}px`,
                minWidth: `${_width}px`,
                width: `${_width}px`
            },
            avatar: {
                height: `${avatarSize}px`,
                width: `${avatarSize}px`
            },
            video: videoStyles
        };

        if (_isHidden) {
            styles.thumbnail.display = 'none';
        }

        return styles;
    }

    _onClick: () => void;

    /**
     * On click handler.
     *
     * @returns {void}
     */
    _onClick() {
        const { _participant, dispatch, _stageFilmstripDisabled } = this.props;
        const { id, pinned } = _participant;

        if (_stageFilmstripDisabled) {
            dispatch(pinParticipant(pinned ? null : id));
        } else {
            dispatch(addStageParticipant(id, true));
        }
    }

    _onMouseEnter: () => void;

    /**
     * Mouse enter handler.
     *
     * @returns {void}
     */
    _onMouseEnter() {
        this.setState({ isHovered: true });
    }

    /**
     * Mouse move handler.
     *
     * @returns {void}
     */
    _onMouseMove() {
        if (!this.state.isHovered) {
            // Workaround for the use case where the layout changes (for example the participant pane is closed)
            // and as a result the mouse appears on top of the thumbnail. In these use cases the mouse enter
            // event on the thumbnail is not triggered in Chrome.
            this.setState({ isHovered: true });
        }
    }

    _onMouseLeave: () => void;

    /**
     * Mouse leave handler.
     *
     * @returns {void}
     */
    _onMouseLeave() {
        this.setState({ isHovered: false });
    }

    _onTouchStart: () => void;

    /**
     * Handler for touch start.
     *
     * @returns {void}
     */
    _onTouchStart() {
        this.timeoutHandle = setTimeout(this._showPopover, SHOW_TOOLBAR_CONTEXT_MENU_AFTER);

        if (this._firstTap) {
            this._clearDoubleClickTimeout();
            this._onClick();

            return;
        }

        this._firstTap = setTimeout(this._clearDoubleClickTimeout, 300);
    }

    _onTouchEnd: () => void;

    /**
     * Cancel showing popover context menu after x miliseconds if the no. Of miliseconds is not reached yet,
     * or just clears the timeout.
     *
     * @returns {void}
     */
    _onTouchEnd() {
        clearTimeout(this.timeoutHandle);
    }

    _onTouchMove: () => void;

    /**
     * Cancel showing Context menu after x miliseconds if the number of miliseconds is not reached
     * before a touch move(drag), or just clears the timeout.
     *
     * @returns {void}
     */
    _onTouchMove() {
        clearTimeout(this.timeoutHandle);
    }

    /**
     * Renders a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant() {
        const { _isMobile, _participant: { avatarURL } } = this.props;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                className = { containerClassName }
                id = 'sharedVideoContainer'
                onClick = { this._onClick }
                { ...(_isMobile ? {} : {
                    onMouseEnter: this._onMouseEnter,
                    onMouseMove: this._onMouseMove,
                    onMouseLeave: this._onMouseLeave
                }) }
                style = { styles.thumbnail }>
                {avatarURL ? (
                    <img
                        className = 'sharedVideoAvatar'
                        src = { avatarURL } />
                )
                    : this._renderAvatar(styles.avatar)}
            </span>
        );
    }

    /**
     * Renders the avatar.
     *
     * @param {Object} styles - The styles that will be applied to the avatar.
     * @returns {ReactElement}
     */
    _renderAvatar(styles) {
        const { _participant } = this.props;
        const { id } = _participant;

        return (
            <div
                className = 'avatar-container'
                style = { styles }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { id } />
            </div>
        );
    }

    /**
     * Returns the container class name.
     *
     * @returns {string} - The class name that will be used for the container.
     */
    _getContainerClassName() {
        let className = 'videocontainer';
        const { displayMode } = this.state;
        const {
            _isDominantSpeakerDisabled,
            _participant,
            _currentLayout,
            _raisedHand,
            classes
        } = this.props;

        className += ` ${DISPLAY_MODE_TO_CLASS_NAME[displayMode]}`;

        if (_raisedHand) {
            className += ` ${classes.raisedHand}`;
        }

        if (!_isDominantSpeakerDisabled && _participant?.dominantSpeaker) {
            className += ` ${classes.activeSpeaker} dominant-speaker`;
        }
        if (_currentLayout !== LAYOUTS.TILE_VIEW && _participant?.pinned) {
            className += ' videoContainerFocused';
        }

        return className;
    }

    _onGifMouseEnter: () => void;

    /**
     * Keep showing the GIF for the current participant.
     *
     * @returns {void}
     */
    _onGifMouseEnter() {
        const { dispatch, _participant: { id } } = this.props;

        dispatch(showGif(id));
    }

    _onGifMouseLeave: () => void;

    /**
     * Keep showing the GIF for the current participant.
     *
     * @returns {void}
     */
    _onGifMouseLeave() {
        const { dispatch, _participant: { id } } = this.props;

        dispatch(hideGif(id));
    }

    /**
     * Renders GIF.
     *
     * @returns {Component}
     */
    _renderGif() {
        const { _gifSrc, classes } = this.props;

        return _gifSrc && (
            <div className = { classes.gif }>
                <img
                    alt = 'GIF'
                    src = { _gifSrc } />
            </div>
        );
    }

    _onCanPlay: Object => void;

    /**
     * Canplay event listener.
     *
     * @param {SyntheticEvent} event - The event.
     * @returns {void}
     */
    _onCanPlay(event) {
        this.setState({ canPlayEventReceived: true });

        const {
            _isTestModeEnabled,
            _videoTrack
        } = this.props;

        if (_videoTrack && _isTestModeEnabled) {
            this._onTestingEvent(event);
        }
    }

    _onTestingEvent: Object => void;

    /**
     * Event handler for testing events.
     *
     * @param {SyntheticEvent} event - The event.
     * @returns {void}
     */
    _onTestingEvent(event) {
        const {
            _videoTrack,
            dispatch
        } = this.props;
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;

        dispatch(updateLastTrackVideoMediaEvent(jitsiVideoTrack, event.type));
    }

    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @param {boolean} local - Whether or not it's the local participant.
     * @returns {ReactElement}
     */
    _renderParticipant(local = false) {
        const {
            _audioTrack,
            _currentLayout,
            _disableLocalVideoFlip,
            _isMobile,
            _isMobilePortrait,
            _isScreenSharing,
            _isTestModeEnabled,
            _localFlipX,
            _participant,
            _videoTrack,
            _gifSrc,
            classes,
            stageFilmstrip
        } = this.props;
        const { id } = _participant || {};
        const { isHovered, popoverVisible } = this.state;
        const styles = this._getStyles();
        let containerClassName = this._getContainerClassName();
        const videoTrackClassName
            = !_disableLocalVideoFlip && _videoTrack && !_isScreenSharing && _localFlipX ? 'flipVideoX' : '';
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const videoTrackId = jitsiVideoTrack && jitsiVideoTrack.getId();
        const videoEventListeners = {};

        if (local) {
            if (_isMobilePortrait) {
                styles.thumbnail.height = styles.thumbnail.width;
                containerClassName = `${containerClassName} self-view-mobile-portrait`;
            }
        } else {
            if (_videoTrack && _isTestModeEnabled) {
                VIDEO_TEST_EVENTS.forEach(attribute => {
                    videoEventListeners[attribute] = this._onTestingEvent;
                });
            }
            videoEventListeners.onCanPlay = this._onCanPlay;
        }

        const video = _videoTrack && <VideoTrack
            className = { local ? videoTrackClassName : '' }
            eventHandlers = { videoEventListeners }
            id = { local ? 'localVideo_container' : `remoteVideo_${videoTrackId || ''}` }
            muted = { local ? undefined : true }
            style = { styles.video }
            videoTrack = { _videoTrack } />;

        return (
            <span
                className = { containerClassName }
                id = { local
                    ? `localVideoContainer${stageFilmstrip ? '_stage' : ''}`
                    : `participant_${id}${stageFilmstrip ? '_stage' : ''}`
                }
                { ...(_isMobile
                    ? {
                        onTouchEnd: this._onTouchEnd,
                        onTouchMove: this._onTouchMove,
                        onTouchStart: this._onTouchStart
                    }
                    : {
                        onClick: this._onClick,
                        onMouseEnter: this._onMouseEnter,
                        onMouseMove: this._onMouseMove,
                        onMouseLeave: this._onMouseLeave
                    }
                ) }
                style = { styles.thumbnail }>
                {!_gifSrc && (local
                    ? <span id = 'localVideoWrapper'>{video}</span>
                    : video)}
                <div className = { classes.containerBackground } />
                <div
                    className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsTopContainer,
                        _currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                    ) }>
                    <ThumbnailTopIndicators
                        currentLayout = { _currentLayout }
                        hidePopover = { this._hidePopover }
                        indicatorsClassName = { classes.indicatorsBackground }
                        isHovered = { isHovered }
                        local = { local }
                        participantId = { id }
                        popoverVisible = { popoverVisible }
                        showPopover = { this._showPopover } />
                </div>
                <div
                    className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsBottomContainer,
                        _currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                    ) }>
                    <ThumbnailBottomIndicators
                        className = { classes.indicatorsBackground }
                        currentLayout = { _currentLayout }
                        local = { local }
                        participantId = { id } />
                </div>
                {!_gifSrc && this._renderAvatar(styles.avatar) }
                { !local && (
                    <div className = 'presence-label-container'>
                        <PresenceLabel
                            className = 'presence-label'
                            participantID = { id } />
                    </div>
                )}
                <ThumbnailAudioIndicator _audioTrack = { _audioTrack } />
                {this._renderGif()}
                <div
                    className = { clsx(classes.borderIndicator,
                    _gifSrc && classes.borderIndicatorOnTop,
                    'raised-hand-border') } />
                <div
                    className = { clsx(classes.borderIndicator,
                    _gifSrc && classes.borderIndicatorOnTop,
                    'active-speaker-indicator') } />
                {_gifSrc && (
                    <div
                        className = { clsx(classes.borderIndicator, classes.borderIndicatorOnTop) }
                        onMouseEnter = { this._onGifMouseEnter }
                        onMouseLeave = { this._onGifMouseLeave } />
                )}
            </span>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _participant } = this.props;

        if (!_participant) {
            return null;
        }

        const { isFakeParticipant, local } = _participant;

        if (local) {
            return this._renderParticipant(true);
        }

        if (isFakeParticipant) {
            return this._renderFakeParticipant();
        }

        return this._renderParticipant();
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID, stageFilmstrip } = ownProps;

    const participant = getParticipantByIdOrUndefined(state, participantID);
    const id = participant?.id;
    const isLocal = participant?.local ?? true;
    const tracks = state['features/base/tracks'];
    const _videoTrack = isLocal
        ? getLocalVideoTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantID);
    const _audioTrack = isLocal
        ? getLocalAudioTrack(tracks) : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, participantID);
    const _currentLayout = stageFilmstrip ? LAYOUTS.TILE_VIEW : getCurrentLayout(state);
    let size = {};
    let _isMobilePortrait = false;
    const {
        defaultLocalDisplayName,
        disableLocalVideoFlip,
        disableTileEnlargement,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const { localFlipX } = state['features/base/settings'];
    const _isMobile = isMobileBrowser();
    const activeParticipants = getActiveParticipantsIds(state);

    switch (_currentLayout) {
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
    case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW: {
        const {
            horizontalViewDimensions = {
                local: {},
                remote: {}
            },
            verticalViewDimensions = {
                local: {},
                remote: {},
                gridView: {}
            }
        } = state['features/filmstrip'];
        const _verticalViewGrid = showGridInVerticalView(state);
        const { local, remote }
            = _currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW
                ? verticalViewDimensions : horizontalViewDimensions;
        const { width, height } = (isLocal ? local : remote) ?? {};

        size = {
            _width: width,
            _height: height
        };

        if (_verticalViewGrid) {
            const { width: _width, height: _height } = verticalViewDimensions.gridView.thumbnailSize;

            size = {
                _width,
                _height
            };
        }

        _isMobilePortrait = _isMobile && state['features/base/responsive-ui'].aspectRatio === ASPECT_RATIO_NARROW;

        break;
    }
    case LAYOUTS.TILE_VIEW: {
        const { thumbnailSize } = state['features/filmstrip'].tileViewDimensions;
        const {
            stageFilmstripDimensions = {
                thumbnailSize: {}
            }
        } = state['features/filmstrip'];

        size = {
            _width: thumbnailSize?.width,
            _height: thumbnailSize?.height
        };

        if (stageFilmstrip) {
            const { width: _width, height: _height } = stageFilmstripDimensions.thumbnailSize;

            size = {
                _width,
                _height
            };
        }
        break;
    }
    }

    const { gifUrl: gifSrc } = getGifForParticipant(state, id);
    const mode = getGifDisplayMode(state);

    return {
        _audioTrack,
        _currentLayout,
        _defaultLocalDisplayName: defaultLocalDisplayName,
        _disableLocalVideoFlip: Boolean(disableLocalVideoFlip),
        _disableTileEnlargement: Boolean(disableTileEnlargement),
        _isActiveParticipant: activeParticipants.find(pId => pId === participantID),
        _isHidden: isLocal && iAmRecorder && !iAmSipGateway,
        _isAudioOnly: Boolean(state['features/base/audio-only'].enabled),
        _isCurrentlyOnLargeVideo: state['features/large-video']?.participantId === id,
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        _isMobile,
        _isMobilePortrait,
        _isScreenSharing: _videoTrack?.videoType === 'desktop',
        _isTestModeEnabled: isTestModeEnabled(state),
        _isVideoPlayable: id && isVideoPlayable(state, id),
        _localFlipX: Boolean(localFlipX),
        _participant: participant,
        _raisedHand: hasRaisedHand(participant),
        _stageFilmstripDisabled: !isStageFilmstripEnabled(state),
        _videoObjectPosition: getVideoObjectPosition(state, participant?.id),
        _videoTrack,
        ...size,
        _gifSrc: mode === 'chat' ? null : gifSrc
    };
}

export default connect(_mapStateToProps)(withStyles(defaultStyles)(Thumbnail));
