/* global $ */

import Logger from 'jitsi-meet-logger';

import SmallVideo from '../videolayout/SmallVideo';

const logger = Logger.getLogger(__filename);

/**
 *
 */
export default class SharedVideoThumb extends SmallVideo {
    /**
     *
     * @param {*} participant
     * @param {*} videoType
     * @param {*} VideoLayout
     */
    constructor(participant, videoType, VideoLayout) {
        super(VideoLayout);
        this.id = participant.id;
        this.isLocal = false;
        this.url = participant.id;
        this.videoSpanId = 'sharedVideoContainer';
        this.container = this.createContainer(this.videoSpanId);
        this.$container = $(this.container);
        this._setThumbnailSize();
        this.bindHoverHandler();
        this.isVideoMuted = true;
        this.updateDisplayName();
        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     */
    initializeAvatar() {} // eslint-disable-line no-empty-function

    /**
     *
     * @param {*} spanId
     */
    createContainer(spanId) {
        const container = document.createElement('span');

        container.id = spanId;
        container.className = 'videocontainer';

        // add the avatar
        const avatar = document.createElement('img');

        avatar.className = 'sharedVideoAvatar';
        avatar.src = `https://img.youtube.com/vi/${this.url}/0.jpg`;
        container.appendChild(avatar);

        const displayNameContainer = document.createElement('div');

        displayNameContainer.className = 'displayNameContainer';
        container.appendChild(displayNameContainer);

        const remoteVideosContainer
            = document.getElementById('filmstripRemoteVideosContainer');
        const localVideoContainer
            = document.getElementById('localVideoTileViewContainer');

        remoteVideosContainer.insertBefore(container, localVideoContainer);

        return container;
    }

    /**
     * Triggers re-rendering of the display name using current instance state.
     *
     * @returns {void}
     */
    updateDisplayName() {
        if (!this.container) {
            logger.warn(`Unable to set displayName - ${this.videoSpanId
            } does not exist`);

            return;
        }

        this._renderDisplayName({
            elementID: `${this.videoSpanId}_name`,
            participantID: this.id
        });
    }
}
