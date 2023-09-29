import React, { Component } from 'react';
import { connect } from 'react-redux';

// @ts-expect-error
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getToolboxHeight } from '../../../toolbox/functions.web';

import VideoManager from './VideoManager';
import YoutubeVideoManager from './YoutubeVideoManager';

interface IProps {

    /**
     * The available client width.
     */
    clientHeight: number;

    /**
     * The available client width.
     */
    clientWidth: number;

    /**
     * Whether the (vertical) filmstrip is visible or not.
     */
    filmstripVisible: boolean;

    /**
     * The width of the vertical filmstrip.
     */
    filmstripWidth: number;

    /**
     * Is the video shared by the local user.
     */
    isOwner: boolean;

    /**
     * Whether or not the user is actively resizing the filmstrip.
     */
    isResizing: boolean;

    /**
     * The shared video url.
     */
    videoUrl?: string;
}

/** .
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * The conference participant who is on the local stage) on Web/React.
 *
 * @augments Component
 */
class SharedVideo extends Component<IProps> {
    /**
     * Computes the width and the height of the component.
     *
     * @returns {{
     *  height: number,
     *  width: number
     * }}
     */
    getDimensions() {
        const { clientHeight, clientWidth, filmstripVisible, filmstripWidth } = this.props;

        let width;
        let height;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = `${clientWidth - filmstripWidth}px`;
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
        const { videoUrl } = this.props;

        if (!videoUrl) {
            return null;
        }

        if (videoUrl.match(/http/)) {
            return <VideoManager videoId = { videoUrl } />;
        }

        return <YoutubeVideoManager videoId = { videoUrl } />;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    render() {
        const { isOwner, isResizing } = this.props;
        const className = !isResizing && isOwner ? '' : 'disable-pointer';

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
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { ownerId, videoUrl } = state['features/shared-video'];
    const { clientHeight, clientWidth } = state['features/base/responsive-ui'];
    const { visible, isResizing } = state['features/filmstrip'];

    const localParticipant = getLocalParticipant(state);

    return {
        clientHeight,
        clientWidth,
        filmstripVisible: visible,
        filmstripWidth: getVerticalViewMaxWidth(state),
        isOwner: ownerId === localParticipant?.id,
        isResizing,
        videoUrl
    };
}

export default connect(_mapStateToProps)(SharedVideo);
