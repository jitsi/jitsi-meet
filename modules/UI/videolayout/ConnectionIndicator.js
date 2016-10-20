/* global APP, $, config */
/* jshint -W101 */
import JitsiPopover from "../util/JitsiPopover";
import VideoLayout from "./VideoLayout";

/**
 * Constructs new connection indicator.
 * @param videoContainer the video container associated with the indicator.
 * @constructor
 */
function ConnectionIndicator(videoContainer, id) {
    this.videoContainer = videoContainer;
    this.bandwidth = null;
    this.packetLoss = null;
    this.bitrate = null;
    this.showMoreValue = false;
    this.resolution = null;
    this.isResolutionHD = null;
    this.transport = [];
    this.popover = null;
    this.id = id;
    this.create();
}

/**
 * Values for the connection quality
 * @type {{98: string,
 *         81: string,
 *         64: string,
 *         47: string,
 *         30: string,
 *         0: string}}
 */
ConnectionIndicator.connectionQualityValues = {
    98: "18px", //full
    81: "15px",//4 bars
    64: "11px",//3 bars
    47: "7px",//2 bars
    30: "3px",//1 bar
    0: "0px"//empty
};

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

    var translate = APP.translation.translateString;

    if(this.bitrate === null) {
        downloadBitrate = "N/A";
        uploadBitrate = "N/A";
    }
    else {
        downloadBitrate =
            this.bitrate.download? this.bitrate.download + " Kbps" : "N/A";
        uploadBitrate =
            this.bitrate.upload? this.bitrate.upload + " Kbps" : "N/A";
    }

    if(this.packetLoss === null) {
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
    let resolutions = this.resolution || {};
    let resolutionStr = Object.keys(resolutions).map(function (ssrc) {
        let {width, height} = resolutions[ssrc];
        return `${width}x${height}`;
    }).join(', ') || 'N/A';

    let result = (
        `<table class="connection-info__container" style='width:100%'>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.bitrate'>
                        ${translate("connectionindicator.bitrate")}
                    </span>
                </td>
                <td>
                    <span class='connection-info__download'>&darr;</span>${downloadBitrate}
                    <span class='connection-info__upload'>&uarr;</span>${uploadBitrate}
                </td>
            </tr>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.packetloss'>
                        ${translate("connectionindicator.packetloss")}
                    </span>
                </td>
                <td>${packetLoss}</td>
            </tr>
            <tr>
                <td>
                    <span data-i18n='connectionindicator.resolution'>
                        ${translate("connectionindicator.resolution")}
                    </span>
                </td>
                <td>
                    ${resolutionStr}
                </td>
            </tr>
        </table>`);

    if(this.videoContainer.videoSpanId == "localVideoContainer") {
        result += "<a class=\"jitsipopover__showmore link\" " +
            "onclick = \"APP.UI.connectionIndicatorShowMore('" +
            // FIXME: we do not know local id when this text is generated
            //this.id + "')\"  data-i18n='connectionindicator." +
            "local')\"  data-i18n='connectionindicator." +
                (this.showMoreValue ? "less" : "more") + "'>" +
            translate("connectionindicator." + (this.showMoreValue ? "less" : "more")) +
            "</a>";
    }

    if (this.showMoreValue) {
        var downloadBandwidth, uploadBandwidth, transport;
        if (this.bandwidth === null) {
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
                "data-i18n='connectionindicator.address'>" +
                translate("connectionindicator.address") + "</span></td>" +
                "<td> N/A</td></tr>";
        } else {
            var data = {remoteIP: [], localIP:[], remotePort:[], localPort:[]};
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
            }

            var local_address_key = "connectionindicator.localaddress";
            var remote_address_key = "connectionindicator.remoteaddress";
            var localTransport =
                "<tr><td><span data-i18n='" +
                local_address_key +"' data-i18n-options='" +
                    JSON.stringify({count: data.localIP.length}) + "'>" +
                    translate(local_address_key, {count: data.localIP.length}) +
                    "</span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.localIP) +
                "</td></tr>";
            transport =
                "<tr><td><span data-i18n='" +
                remote_address_key + "' data-i18n-options='" +
                    JSON.stringify({count: data.remoteIP.length}) + "'>" +
                    translate(remote_address_key,
                        {count: data.remoteIP.length}) +
                    "</span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.remoteIP) +
                "</td></tr>";

            var key_remote = "connectionindicator.remoteport",
                key_local = "connectionindicator.localport";

            transport += "<tr>" +
                "<td>" +
                "<span data-i18n='" + key_remote +
                "' data-i18n-options='" +
                JSON.stringify({count: this.transport.length}) + "'>" +
                translate(key_remote, {count: this.transport.length}) +
                "</span></td><td>";
            localTransport += "<tr>" +
                "<td>" +
                "<span data-i18n='" + key_local +
                "' data-i18n-options='" +
                JSON.stringify({count: this.transport.length}) + "'>" +
                translate(key_local, {count: this.transport.length}) +
                "</span></td><td>";

            transport +=
                ConnectionIndicator.getStringFromArray(data.remotePort);
            localTransport +=
                ConnectionIndicator.getStringFromArray(data.localPort);
            transport += "</td></tr>";
            transport += localTransport + "</td></tr>";
            transport +="<tr>" +
                "<td><span data-i18n='connectionindicator.transport'>" +
                translate("connectionindicator.transport") + "</span></td>" +
                "<td>" + this.transport[0].type + "</td></tr>";

        }

        result += "<table class='connection-info__container' style='width:100%'>" +
            "<tr>" +
            "<td>" +
            "<span data-i18n='connectionindicator.bandwidth'>" +
            translate("connectionindicator.bandwidth") + "</span>" +
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
    this.connectionIndicatorContainer = document.createElement("div");
    this.connectionIndicatorContainer.className = "connectionindicator";
    this.connectionIndicatorContainer.style.display = "none";
    this.videoContainer.container.appendChild(
        this.connectionIndicatorContainer);
    this.popover = new JitsiPopover(
        $("#" + this.videoContainer.videoSpanId + " > .connectionindicator"),
        {content: "<div class=\"connection-info\" data-i18n='connectionindicator.na'>" +
            APP.translation.translateString("connectionindicator.na") + "</div>",
            skin: "black"});

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

    this.emptyIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_empty"], "icon-connection"));
    this.fullIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_full"], "icon-connection"));
    this.interruptedIndicator = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_lost"],"icon-connection-lost"));
    $(this.interruptedIndicator).hide();
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
        this.updateConnectionQuality(0 /* zero bars */);
    }
};

/**
 * Updates the data of the indicator
 * @param percent the percent of connection quality
 * @param object the statistics data.
 */
ConnectionIndicator.prototype.updateConnectionQuality =
    function (percent, object) {
    if (percent === null) {
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
    }
    for (var quality in ConnectionIndicator.connectionQualityValues) {
        if (percent >= quality) {
            this.fullIcon.style.width =
                ConnectionIndicator.connectionQualityValues[quality];
        }
    }
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
        APP.translation.translateElement($(".connection-info"));
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

export default ConnectionIndicator;
