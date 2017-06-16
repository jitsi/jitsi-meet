/* global $, interfaceConfig, JitsiMeetJS */
/* jshint -W101 */

/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';

import { ConnectionStatsTable } from '../../../react/features/connection-stats';
/* eslint-enable no-unused-vars */

import JitsiPopover from "../util/JitsiPopover";
import UIUtil from "../util/UIUtil";

const ParticipantConnectionStatus
    = JitsiMeetJS.constants.participantConnectionStatus;

/**
 * Maps a connection quality value (in percent) to the width of the "full" icon.
 */
const qualityToWidth = [
    // Full (5 bars)
    {percent: 80, width: "100%"},
    // 4 bars
    {percent: 60, width: "80%"},
    // 3 bars
    {percent: 40, width: "55%"},
    // 2 bars
    {percent: 20, width: "40%"},
    // 1 bar
    {percent: 0, width: "20%"}
    // Note: we never show 0 bars.
];

/**
 * Constructs new connection indicator.
 * @param videoContainer the video container associated with the indicator.
 * @param videoId the identifier of the video
 * @constructor
 */
function ConnectionIndicator(videoContainer, videoId) {
    this.videoContainer = videoContainer;
    this.bandwidth = null;
    this.packetLoss = null;
    this.bitrate = null;
    this.showMoreValue = false;
    this.resolution = null;
    this.transport = [];
    this.framerate = null;
    this.popover = null;
    this.id = videoId;
    this.create();

    this.isLocalVideo
        = this.videoContainer.videoSpanId === 'localVideoContainer';
    this.showMore = this.showMore.bind(this);
}

/**
 * Generates the html content.
 * @returns {string} the html content.
 */
ConnectionIndicator.prototype.generateText = function () {
    /* jshint ignore:start */
    return (
        <ConnectionStatsTable
            bandwidth = { this.bandwidth }
            bitrate = { this.bitrate }
            isLocalVideo = { this.isLocalVideo }
            framerate = { this.framerate }
            onShowMore = { this.showMore }
            packetLoss = { this.packetLoss}
            resolution = { this.resolution }
            shouldShowMore = { this.showMoreValue }
            transport = { this.transport } />
    );
    /* jshint ignore:end */
};

/**
 * Shows or hide the additional information.
 */
ConnectionIndicator.prototype.showMore = function () {
    this.showMoreValue = !this.showMoreValue;
    this.updatePopoverData();
};


function createIcon(classes, iconClass) {
    var icon = document.createElement("span");
    for(var i in classes) {
        icon.classList.add(classes[i]);
    }
    icon.appendChild(
        document.createElement("i")).classList.add(iconClass);
    return icon;
}

/**
 * Creates the indicator
 */
ConnectionIndicator.prototype.create = function () {
    let indicatorId = 'connectionindicator';
    let element = UIUtil.getVideoThumbnailIndicatorSpan({
        videoSpanId: this.videoContainer.videoSpanId,
        indicatorId
    });
    element.classList.add('show');
    this.connectionIndicatorContainer = element;

    let popoverContent = (
        `<div class="connection-info" data-i18n="${indicatorId}.na"></div>`
    );
    this.popover = new JitsiPopover($(element), {
        content: popoverContent,
        skin: "black",
        position: interfaceConfig.VERTICAL_FILMSTRIP ? 'left' : 'top'
    });

    // override popover show method to make sure we will update the content
    // before showing the popover
    var origShowFunc = this.popover.show;
    this.popover.show = function () {
        // update content by forcing it, to finish even if popover
        // is not visible
        this.updatePopoverData(true);
        // call the original show, passing its actual this
        origShowFunc.call(this.popover);
    }.bind(this);

    let connectionIconContainer = document.createElement('div');
    connectionIconContainer.className = 'connection indicatoricon';


    this.emptyIcon = connectionIconContainer.appendChild(
        createIcon(["connection_empty"], "icon-connection"));
    this.fullIcon = connectionIconContainer.appendChild(
        createIcon(["connection_full"], "icon-connection"));
    this.interruptedIndicator = connectionIconContainer.appendChild(
        createIcon(["connection_lost"],"icon-connection-lost"));
    this.ninjaIndicator = connectionIconContainer.appendChild(
        createIcon(["connection_ninja"],"icon-ninja"));

    $(this.interruptedIndicator).hide();
    $(this.ninjaIndicator).hide();
    this.connectionIndicatorContainer.appendChild(connectionIconContainer);
};

/**
 * Removes the indicator
 */
ConnectionIndicator.prototype.remove = function() {
    if (this.connectionIndicatorContainer.parentNode) {
        this.connectionIndicatorContainer.parentNode.removeChild(
            this.connectionIndicatorContainer);
    }
    this.popover.forceHide();
};

/**
 * Updates the UI which displays or not a warning about user's connectivity
 * problems.
 *
 * @param {ParticipantConnectionStatus} connectionStatus
 */
ConnectionIndicator.prototype.updateConnectionStatusIndicator
= function (connectionStatus) {
    this.connectionStatus = connectionStatus;
    if (connectionStatus === ParticipantConnectionStatus.INTERRUPTED) {
        $(this.interruptedIndicator).show();
        $(this.emptyIcon).hide();
        $(this.fullIcon).hide();
        $(this.ninjaIndicator).hide();
    } else if (connectionStatus === ParticipantConnectionStatus.INACTIVE) {
        $(this.interruptedIndicator).hide();
        $(this.emptyIcon).hide();
        $(this.fullIcon).hide();
        $(this.ninjaIndicator).show();
    } else {
        $(this.interruptedIndicator).hide();
        $(this.emptyIcon).show();
        $(this.fullIcon).show();
        $(this.ninjaIndicator).hide();
    }
};

/**
 * Updates the data of the indicator
 * @param percent the percent of connection quality
 * @param object the statistics data.
 */
ConnectionIndicator.prototype.updateConnectionQuality =
    function (percent, object) {
    if (!percent) {
        this.connectionIndicatorContainer.style.display = "none";
        this.popover.forceHide();
        return;
    } else {
        if(this.connectionIndicatorContainer.style.display == "none") {
            this.connectionIndicatorContainer.style.display = "block";
        }
    }
    if (object) {
        this.bandwidth = object.bandwidth;
        this.bitrate = object.bitrate;
        this.packetLoss = object.packetLoss;
        this.transport = object.transport;
        if (object.resolution) {
            this.resolution = object.resolution;
        }
        if (object.framerate)
            this.framerate = object.framerate;
    }

    let width = qualityToWidth.find(x => percent >= x.percent);
    this.fullIcon.style.width = width.width;

    this.updatePopoverData();
};

/**
 * Updates the resolution
 * @param resolution the new resolution
 */
ConnectionIndicator.prototype.updateResolution = function (resolution) {
    this.resolution = resolution;
    this.updatePopoverData();
};

/**
 * Updates the framerate
 * @param framerate the new resolution
 */
ConnectionIndicator.prototype.updateFramerate = function (framerate) {
    this.framerate = framerate;
    this.updatePopoverData();
};

/**
 * Updates the content of the popover if its visible
 * @param force to work even if popover is not visible
 */
ConnectionIndicator.prototype.updatePopoverData = function (force) {
    // generate content, translate it and add it to document only if
    // popover is visible or we force to do so.
    if(this.popover.popoverShown || force) {
        this.popover.updateContent(this.generateText());
    }
};

/**
 * Hides the popover
 */
ConnectionIndicator.prototype.hide = function () {
    this.popover.forceHide();
};

/**
 * Hides the indicator
 */
ConnectionIndicator.prototype.hideIndicator = function () {
    this.connectionIndicatorContainer.style.display = "none";
    if(this.popover)
        this.popover.forceHide();
};

/**
 * Adds a hover listener to the popover.
 */
ConnectionIndicator.prototype.addPopoverHoverListener = function (listener) {
    this.popover.addOnHoverPopover(listener);
};

export default ConnectionIndicator;
