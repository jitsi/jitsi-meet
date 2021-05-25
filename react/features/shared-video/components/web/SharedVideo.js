// @flow

import React, { Component } from 'react';

import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { getToolboxHeight } from '../../../toolbox/functions.web';
import { getYoutubeId } from '../../functions';

import VideoManager from './VideoManager';
import YoutubeVideoManager from './YoutubeVideoManager';

declare var interfaceConfig: Object;

type Props = {

    /**
     * The available client width
     */
    clientHeight: number,

    /**
     * The available client width
     */
    clientWidth: number,

    /**
     * Whether the (vertical) filmstrip is visible or not.
     */
    filmstripVisible: boolean,

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
     isOwner: boolean,

    /**
     * The shared video id
     */
     sharedVideoId: string,

    /**
     * The shared youtube video id
     */
     sharedYoutubeVideoId: string,
}

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on Web/React.
 *
 * @extends Component
 */
class SharedVideo extends Component<Props> {
    /**
     * Computes the width and the height of the component.
     *
     * @returns {{
     *  height: number,
     *  width: number
     * }}
     */
    getDimensions() {
        const { clientHeight, clientWidth, filmstripVisible } = this.props;

        let width;
        let height;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = `${clientWidth - Filmstrip.getVerticalFilmstripWidth()}px`;
            } else {
                width = `${clientWidth}px`;
            }
            height = `${clientHeight - getToolboxHeight()}px`;
        } else {
            if (filmstripVisible) {
                height = `${clientHeight - Filmstrip.getFilmstripHeight()}px`;
            } else {
                height = `${clientHeight}px`;
            }
            width = `${clientWidth}px`;
        }

        return {
            width,
            height
        };
    }

    /**
     * Retrieves the manager to be used for playing the shared video.
     *
     * @returns {Component}
     */
    getManager() {
        const {
            sharedVideoId,
            sharedYoutubeVideoId
        } = this.props;

        if (!sharedVideoId) {
            return null;
        }

        if (sharedYoutubeVideoId) {
            return <YoutubeVideoManager videoId = { sharedYoutubeVideoId } />;
        }

        return <VideoManager videoId = { sharedVideoId } />;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const { isOwner } = this.props;
        const className = isOwner ? '' : 'disable-pointer';

        return (
            <div
                className = { className }
                id = 'sharedVideo'
                style = { this.getDimensions() }>
                {this.getManager()}
            </div>
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
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { visible } = state['features/filmstrip'];

    const localParticipant = getLocalParticipant(state);

    return {
        clientHeight,
        clientWidth,
        filmstripVisible: visible,
        isOwner: ownerId === localParticipant.id,
        sharedVideoId: videoUrl,
        sharedYoutubeVideoId: getYoutubeId(videoUrl)
    };
}

export default connect(_mapStateToProps)(SharedVideo);
