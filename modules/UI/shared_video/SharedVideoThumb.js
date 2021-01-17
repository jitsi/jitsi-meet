/* global $, APP */

/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';

import { i18next } from '../../../react/features/base/i18n';
import { Thumbnail } from '../../../react/features/filmstrip';
import SmallVideo from '../videolayout/SmallVideo';
/* eslint-enable no-unused-vars */

/**
 *
 */
export default class SharedVideoThumb extends SmallVideo {
    /**
     *
     * @param {*} participant
     */
    constructor(participant) {
        super();
        this.id = participant.id;
        this.isLocal = false;
        this.url = participant.id;
        this.videoSpanId = 'sharedVideoContainer';
        this.container = this.createContainer(this.videoSpanId);
        this.$container = $(this.container);
        this.renderThumbnail();
        this._setThumbnailSize();
        this.bindHoverHandler();
        this.container.onclick = this._onContainerClick;
    }

    /**
     *
     * @param {*} spanId
     */
    createContainer(spanId) {
        const container = document.createElement('span');

        container.id = spanId;
        container.className = 'videocontainer';

        const remoteVideosContainer
            = document.getElementById('filmstripRemoteVideosContainer');
        const localVideoContainer
            = document.getElementById('localVideoTileViewContainer');

        remoteVideosContainer.insertBefore(container, localVideoContainer);

        return container;
    }

    /**
     * Renders the thumbnail.
     */
    renderThumbnail(isHovered = false) {
        ReactDOM.render(
            <Provider store = { APP.store }>
                <I18nextProvider i18n = { i18next }>
                    <Thumbnail participantID = { this.id } isHovered = { isHovered } />
                </I18nextProvider>
            </Provider>, this.container);
    }
}
