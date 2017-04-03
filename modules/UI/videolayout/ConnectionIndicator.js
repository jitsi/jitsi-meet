/* global $, APP, config */
/* jshint -W101 */
import JitsiPopover from "../util/JitsiPopover";
import VideoLayout from "./VideoLayout";
import UIUtil from "../util/UIUtil";

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
    this.isResolutionHD = null;
    this.transport = [];
    this.framerate = null;
    this.popover = null;
    this.id = videoId;
    this.create();
}

ConnectionIndicator.getIP = function(value) {
    return value.substring(0, value.lastIndexOf(":"));
};

ConnectionIndicator.getPort = function(value) {
    return value.substring(value.lastIndexOf(":") + 1, value.length);
};

ConnectionIndicator.getStringFromArray = function (array) {
    var res = "";
    for(var i = 0; i < array.length; i++) {
        res += (i === 0? "" : ", ") + array[i];
    }
    return res;
};

/**
 * Generates the html content.
 * @returns {string} the html content.
 */
ConnectionIndicator.prototype.generateText = function () {
    var downloadBitrate, uploadBitrate, packetLoss, i;

    if(!this.bitrate) {
        downloadBitrate = "N/A";
        uploadBitrate = "N/A";
    }
    else {
        downloadBitrate =
            this.bitrate.download? this.bitrate.download + " Kbps" : "N/A";
        uploadBitrate =
            this.bitrate.upload? this.bitrate.upload + " Kbps" : "N/A";
    }

    if(!this.packetLoss) {
        packetLoss = "N/A";
    } else {

        packetLoss = "<span class='connection-info__download'>&darr;</span>" +
            (this.packetLoss.download !== null ?
                this.packetLoss.download : "N/A") +
            "% <span class='connection-info__upload'>&uarr;</span>" +
            (this.packetLoss.upload !== null? this.packetLoss.upload : "N/A") +
            "%";
    }

    // GENERATE RESOLUTIONS STRING
    const resolutions = this.resolution || {};
    const resolutionStr = Object.keys(resolutions).map(ssrc => {
        let {width, height} = resolutions[ssrc];
        return `${width}x${height}`;
    }).join(', ') || 'N/A';

    const framerates = this.framerate || {};
    const frameRateStr = Object.keys(framerates).map(ssrc =>
        framerates[ssrc]
    ).join(', ') || 'N/A';

    let result = (
        `<table class="connection-info__container" style='width:100%'>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.bitrate'></span>
                </td>
                <td>
                    <span class='connection-info__download'>&darr;</span>${downloadBitrate}
                    <span class='connection-info__upload'>&uarr;</span>${uploadBitrate}
                </td>
            </tr>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.packetloss'></span>
                </td>
                <td>${packetLoss}</td>
            </tr>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.resolution'></span>
                </td>
                <td>
                    ${resolutionStr}
                </td>
            </tr>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.framerate'></span>
                </td>
                <td>
                    ${frameRateStr}
                </td>
            </tr>
        </table>`);

    if(this.videoContainer.videoSpanId == "localVideoContainer") {
        result += "<a class=\"jitsipopover__showmore link\" " +
            "onclick = \"APP.UI.connectionIndicatorShowMore('" +
            // FIXME: we do not know local id when this text is generated
            //this.id + "')\"  data-i18n='connectionindicator." +
            "local')\"  data-i18n='connectionindicator." +
                (this.showMoreValue ? "less" : "more") + "'></a>";
    }

    if (this.showMoreValue) {
        var downloadBandwidth, uploadBandwidth, transport;
        if (!this.bandwidth) {
            downloadBandwidth = "N/A";
            uploadBandwidth = "N/A";
        } else {
            downloadBandwidth = this.bandwidth.download?
                this.bandwidth.download + " Kbps" :
                "N/A";
            uploadBandwidth = this.bandwidth.upload?
                this.bandwidth.upload + " Kbps" :
                "N/A";
        }

        if (!this.transport || this.transport.length === 0) {
            transport = "<tr>" +
                "<td><span " +
                "data-i18n='connectionindicator.address'></span></td>" +
                "<td> N/A</td></tr>";
        } else {
            var data = {
                remoteIP: [],
                localIP:[],
                remotePort:[],
                localPort:[],
                transportType:[]};
            for(i = 0; i < this.transport.length; i++) {
                var ip =  ConnectionIndicator.getIP(this.transport[i].ip);
                var port = ConnectionIndicator.getPort(this.transport[i].ip);
                var localIP =
                    ConnectionIndicator.getIP(this.transport[i].localip);
                var localPort =
                    ConnectionIndicator.getPort(this.transport[i].localip);
                if(data.remoteIP.indexOf(ip) == -1) {
                    data.remoteIP.push(ip);
                }

                if(data.remotePort.indexOf(port) == -1) {
                    data.remotePort.push(port);
                }

                if(data.localIP.indexOf(localIP) == -1) {
                    data.localIP.push(localIP);
                }

                if(data.localPort.indexOf(localPort) == -1) {
                    data.localPort.push(localPort);
                }

                if(data.transportType.indexOf(this.transport[i].type) == -1) {
                    data.transportType.push(this.transport[i].type);
                }
            }

            // All of the transports should be either P2P or JVB
            const isP2P = this.transport.length ? this.transport[0].p2p : false;

            var local_address_key = "connectionindicator.localaddress";
            var remote_address_key = "connectionindicator.remoteaddress";
            var localTransport =
                "<tr><td><span data-i18n='" +
                local_address_key +"' data-i18n-options='" +
                    JSON.stringify({count: data.localIP.length})
                        + "'></span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.localIP) +
                "</td></tr>";
            transport =
                "<tr><td><span data-i18n='" +
                remote_address_key + "' data-i18n-options='" +
                    JSON.stringify({count: data.remoteIP.length})
                        + "'></span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.remoteIP);

            // Append (p2p) to indicate the P2P type of transport
            if (isP2P) {
                transport
                    += "<span data-i18n='connectionindicator.peer_to_peer'>";
            }
            transport += "</td></tr>";

            var key_remote = "connectionindicator.remoteport",
                key_local = "connectionindicator.localport";

            transport += "<tr>" +
                "<td>" +
                "<span data-i18n='" + key_remote +
                "' data-i18n-options='" +
                    JSON.stringify({count: this.transport.length})
                        + "'></span></td><td>";
            localTransport += "<tr>" +
                "<td>" +
                "<span data-i18n='" + key_local +
                "' data-i18n-options='" +
                    JSON.stringify({count: this.transport.length})
                        + "'></span></td><td>";

            transport +=
                ConnectionIndicator.getStringFromArray(data.remotePort);
            localTransport +=
                ConnectionIndicator.getStringFromArray(data.localPort);
            transport += "</td></tr>";
            transport += localTransport + "</td></tr>";
            transport +="<tr>" +
                "<td><span data-i18n='connectionindicator.transport' "
                    + " data-i18n-options='" +
                    JSON.stringify({count: data.transportType.length})
                + "'></span></td>" +
                "<td>"
                    + ConnectionIndicator.getStringFromArray(data.transportType);
                + "</td></tr>";

        }

        result += "<table class='connection-info__container' style='width:100%'>" +
            "<tr>" +
            "<td>" +
            "<span data-i18n='connectionindicator.bandwidth'></span>" +
            "</td><td>" +
            "<span class='connection-info__download'>&darr;</span>" +
            downloadBandwidth +
            " <span class='connection-info__upload'>&uarr;</span>" +
            uploadBandwidth + "</td></tr>";

        result += transport + "</table>";
    }

    return result;
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
        onBeforePosition: el => APP.translation.translateElement(el)
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

    $(this.interruptedIndicator).hide();
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
 * Updates the UI which displays warning about user's connectivity problems.
 *
 * @param {boolean} isActive true if the connection is working fine or false if
 * the user is having connectivity issues.
 */
ConnectionIndicator.prototype.updateConnectionStatusIndicator
    = function (isActive) {
        this.isConnectionActive = isActive;
        if (this.isConnectionActive) {
            $(this.interruptedIndicator).hide();
            $(this.emptyIcon).show();
            $(this.fullIcon).show();
        } else {
            $(this.interruptedIndicator).show();
            $(this.emptyIcon).hide();
            $(this.fullIcon).hide();
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

    if (object && typeof object.isResolutionHD === 'boolean') {
        this.isResolutionHD = object.isResolutionHD;
    }
    this.updateResolutionIndicator();
    this.updatePopoverData();
};

/**
 * Updates the resolution
 * @param resolution the new resolution
 */
ConnectionIndicator.prototype.updateResolution = function (resolution) {
    this.resolution = resolution;
    this.updateResolutionIndicator();
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
        this.popover.updateContent(
            `<div class="connection-info">${this.generateText()}</div>`
        );
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
 * Updates the resolution indicator.
 */
ConnectionIndicator.prototype.updateResolutionIndicator = function () {

    if (this.id !== null
        && VideoLayout.isCurrentlyOnLarge(this.id)) {

        let showResolutionLabel = false;

        if (this.isResolutionHD !== null)
            showResolutionLabel = this.isResolutionHD;
        else if (this.resolution !== null) {
            let resolutions = this.resolution || {};
            Object.keys(resolutions).map(function (ssrc) {
                    const { height } = resolutions[ssrc];
                    if (height >= config.minHDHeight)
                        showResolutionLabel = true;
                });
        }

        VideoLayout.updateResolutionLabel(showResolutionLabel);
    }
};

/**
 * Adds a hover listener to the popover.
 */
ConnectionIndicator.prototype.addPopoverHoverListener = function (listener) {
    this.popover.addOnHoverPopover(listener);
};

export default ConnectionIndicator;
