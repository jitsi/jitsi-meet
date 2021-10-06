// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_WIDE } from '../../../base/responsive-ui';
import { setToolboxVisible } from '../../../toolbox/actions';

import VideoManager from './VideoManager';
import YoutubeVideoManager from './YoutubeVideoManager';
import styles from './styles';

type Props = {

    /**
     * The Redux dispatch function.
     */
     dispatch: Function,

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    isOwner: boolean,

    /**
     * True if in landscape mode.
     *
     * @private
     */
     isWideScreen: boolean,

    /**
     * The available player width
     */
    playerHeight: number,

    /**
     * The available player width
     */
    playerWidth: number,

    /**
     * The shared video url
     */
     videoUrl: string,
}

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on Web/React.
 *
 * @extends Component
 */
class SharedVideo extends Component<Props> {
    /**
     * Initializes a new {@code SharedVideo} instance.
     *
     * @param {Object} props - The properties.
     */
    constructor(props: Props) {
        super(props);

        this.setWideScreenMode(props.isWideScreen);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        const { isWideScreen } = this.props;

        if (isWideScreen !== prevProps.isWideScreen) {
            this.setWideScreenMode(isWideScreen);
        }
    }

    /**
     * Dispatches action to set the visibility of the toolbox, true if not widescreen, false otherwise.
     *
     * @param {isWideScreen} isWideScreen - Whether the screen is wide.
     * @private
     * @returns {void}
    */
    setWideScreenMode(isWideScreen) {
        this.props.dispatch(setToolboxVisible(!isWideScreen));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const {
            isOwner,
            playerHeight,
            playerWidth,
            videoUrl
        } = this.props;

        if (!videoUrl) {
            return null;
        }

        return (
            <View
                pointerEvents = { isOwner ? 'auto' : 'none' }
                style = { styles.videoContainer } >
                {videoUrl.match(/http/)
                    ? (
                        <VideoManager
                            height = { playerHeight }
                            videoId = { videoUrl }
                            width = { playerWidth } />
                    ) : (
                        <YoutubeVideoManager
                            height = { playerHeight }
                            videoId = { videoUrl }
                            width = { playerWidth } />
                    )
                }
            </View>
        );
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
    const { ownerId, videoUrl } = state['features/shared-video'];
    const { aspectRatio, clientHeight, clientWidth } = state['features/base/responsive-ui'];

    const isWideScreen = aspectRatio === ASPECT_RATIO_WIDE;
    const localParticipant = getLocalParticipant(state);

    let playerHeight, playerWidth;

    if (isWideScreen) {
        playerHeight = clientHeight;
        playerWidth = playerHeight * 16 / 9;
    } else {
        playerWidth = clientWidth;
        playerHeight = playerWidth * 9 / 16;
    }

    return {
        isOwner: ownerId === localParticipant.id,
        isWideScreen,
        playerHeight,
        playerWidth,
        videoUrl
    };
}

export default connect(_mapStateToProps)(SharedVideo);
