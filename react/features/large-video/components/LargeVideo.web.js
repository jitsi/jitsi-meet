// @flow

import React, { Component } from 'react';

import { Watermarks } from '../../base/react';
import { connect } from '../../base/redux';
import { setColorAlpha } from '../../base/util';
import { SharedVideo } from '../../shared-video/components/web';
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
     * The Redux dispatch function.
     */
    dispatch: Function
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class LargeVideo extends Component<Props> {
    _tappedTimeout: ?TimeoutID;

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._clearTapTimeout = this._clearTapTimeout.bind(this);
        this._onDoubleTap = this._onDoubleTap.bind(this);
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
            _noAutoPlayVideo
        } = this.props;
        const style = this._getCustomSyles();
        const className = `videocontainer${_isChatOpen ? ' shift-right' : ''}`;

        return (
            <div
                className = { className }
                id = 'largeVideoContainer'
                style = { style }>
                <SharedVideo />
                <div id = 'etherpad' />

                <Watermarks />

                <div
                    id = 'dominantSpeaker'
                    onTouchEnd = { this._onDoubleTap }>
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
                    <div
                        id = 'largeVideoWrapper'
                        onTouchEnd = { this._onDoubleTap }
                        role = 'figure' >
                        <video
                            autoPlay = { !_noAutoPlayVideo }
                            id = 'largeVideo'
                            muted = { true }
                            playsInline = { true } /* for Safari on iOS to work */ />
                    </div>
                </div>
                { interfaceConfig.DISABLE_TRANSCRIPTION_SUBTITLES
                    || <Captions /> }
            </div>
        );
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
        const { _customBackgroundColor, _customBackgroundImageUrl } = this.props;

        styles.backgroundColor = _customBackgroundColor || interfaceConfig.DEFAULT_BACKGROUND;

        if (this.props._backgroundAlpha !== undefined) {
            const alphaColor = setColorAlpha(styles.backgroundColor, this.props._backgroundAlpha);

            styles.backgroundColor = alphaColor;
        }

        if (_customBackgroundImageUrl) {
            styles.backgroundImage = `url(${_customBackgroundImageUrl})`;
            styles.backgroundSize = 'cover';
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

    return {
        _backgroundAlpha: state['features/base/config'].backgroundAlpha,
        _customBackgroundColor: backgroundColor,
        _customBackgroundImageUrl: backgroundImageUrl,
        _isChatOpen: isChatOpen,
        _noAutoPlayVideo: testingConfig?.noAutoPlayVideo
    };
}

export default connect(_mapStateToProps)(LargeVideo);
