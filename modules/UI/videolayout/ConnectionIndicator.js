var JitsiPopover = require("../util/JitsiPopover");

/**
 * Constructs new connection indicator.
 * @param videoContainer the video container associated with the indicator.
 * @constructor
 */
function ConnectionIndicator(videoContainer, jid, VideoLayout)
{
    this.videoContainer = videoContainer;
    this.bandwidth = null;
    this.packetLoss = null;
    this.bitrate = null;
    this.showMoreValue = false;
    this.resolution = null;
    this.transport = [];
    this.popover = null;
    this.jid = jid;
    this.create();
    this.videoLayout = VideoLayout;
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

ConnectionIndicator.getIP = function(value)
{
    return value.substring(0, value.lastIndexOf(":"));
};

ConnectionIndicator.getPort = function(value)
{
    return value.substring(value.lastIndexOf(":") + 1, value.length);
};

ConnectionIndicator.getStringFromArray = function (array) {
    var res = "";
    for(var i = 0; i < array.length; i++)
    {
        res += (i === 0? "" : ", ") + array[i];
    }
    return res;
};

/**
 * Generates the html content.
 * @returns {string} the html content.
 */
ConnectionIndicator.prototype.generateText = function () {
    var downloadBitrate, uploadBitrate, packetLoss, resolution, i;

    var translate = APP.translation.translateString;

    if(this.bitrate === null)
    {
        downloadBitrate = "N/A";
        uploadBitrate = "N/A";
    }
    else
    {
        downloadBitrate =
            this.bitrate.download? this.bitrate.download + " Kbps" : "N/A";
        uploadBitrate =
            this.bitrate.upload? this.bitrate.upload + " Kbps" : "N/A";
    }

    if(this.packetLoss === null)
    {
        packetLoss = "N/A";
    }
    else
    {

        packetLoss = "<span class='jitsipopover_green'>&darr;</span>" +
            (this.packetLoss.download !== null? this.packetLoss.download : "N/A") +
            "% <span class='jitsipopover_orange'>&uarr;</span>" +
            (this.packetLoss.upload !== null? this.packetLoss.upload : "N/A") + "%";
    }

    var resolutionValue = null;
    if(this.resolution && this.jid != null)
    {
        var keys = Object.keys(this.resolution);
        for(var ssrc in this.resolution)
        {
            resolutionValue = this.resolution[ssrc];
        }
    }

    if(this.jid === null)
    {
        resolution = "";
        if(this.resolution === null || !Object.keys(this.resolution) ||
            Object.keys(this.resolution).length === 0)
        {
            resolution = "N/A";
        }
        else
            for(i in this.resolution)
            {
                resolutionValue = this.resolution[i];
                if(resolutionValue)
                {
                    if(resolutionValue.height &&
                        resolutionValue.width)
                    {
                        resolution += (resolution === ""? "" : ", ") +
                            resolutionValue.width + "x" +
                            resolutionValue.height;
                    }
                }
            }
    }
    else if(!resolutionValue ||
        !resolutionValue.height ||
        !resolutionValue.width)
    {
        resolution = "N/A";
    }
    else
    {
        resolution = resolutionValue.width + "x" + resolutionValue.height;
    }

    var result = "<table style='width:100%'>" +
        "<tr>" +
        "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.bitrate'>" +
        translate("connectionindicator.bitrate") + "</span></td>" +
        "<td><span class='jitsipopover_green'>&darr;</span>" +
        downloadBitrate + " <span class='jitsipopover_orange'>&uarr;</span>" +
        uploadBitrate + "</td>" +
        "</tr><tr>" +
        "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.packetloss'>" +
        translate("connectionindicator.packetloss") + "</span></td>" +
        "<td>" + packetLoss  + "</td>" +
        "</tr><tr>" +
        "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.resolution'>" +
        translate("connectionindicator.resolution") + "</span></td>" +
        "<td>" + resolution + "</td></tr></table>";

    if(this.videoContainer.id == "localVideoContainer") {
        result += "<div class=\"jitsipopover_showmore\" " +
            "onclick = \"APP.UI.connectionIndicatorShowMore('" +
            this.videoContainer.id + "')\"  data-i18n='connectionindicator." +
                (this.showMoreValue ? "less" : "more") + "'>" +
            translate("connectionindicator." + (this.showMoreValue ? "less" : "more")) +
            "</div><br />";
    }

    if(this.showMoreValue)
    {
        var downloadBandwidth, uploadBandwidth, transport;
        if(this.bandwidth === null)
        {
            downloadBandwidth = "N/A";
            uploadBandwidth = "N/A";
        }
        else
        {
            downloadBandwidth = this.bandwidth.download?
                this.bandwidth.download + " Kbps" :
                "N/A";
            uploadBandwidth = this.bandwidth.upload?
                this.bandwidth.upload + " Kbps" :
                "N/A";
        }

        if(!this.transport || this.transport.length === 0)
        {
            transport = "<tr>" +
                "<td><span class='jitsipopover_blue' " +
                "data-i18n='connectionindicator.address'>" +
                translate("connectionindicator.address") + "</span></td>" +
                "<td> N/A</td></tr>";
        }
        else
        {
            var data = {remoteIP: [], localIP:[], remotePort:[], localPort:[]};
            for(i = 0; i < this.transport.length; i++)
            {
                var ip =  ConnectionIndicator.getIP(this.transport[i].ip);
                var port = ConnectionIndicator.getPort(this.transport[i].ip);
                var localIP =
                    ConnectionIndicator.getIP(this.transport[i].localip);
                var localPort =
                    ConnectionIndicator.getPort(this.transport[i].localip);
                if(data.remoteIP.indexOf(ip) == -1)
                {
                    data.remoteIP.push(ip);
                }

                if(data.remotePort.indexOf(port) == -1)
                {
                    data.remotePort.push(port);
                }

                if(data.localIP.indexOf(localIP) == -1)
                {
                    data.localIP.push(localIP);
                }

                if(data.localPort.indexOf(localPort) == -1)
                {
                    data.localPort.push(localPort);
                }

            }

            var local_address_key = "connectionindicator.localaddress";
            var remote_address_key = "connectionindicator.remoteaddress";
            var localTransport =
                "<tr><td><span class='jitsipopover_blue' data-i18n='" +
                local_address_key +"' data-i18n-options='" +
                    JSON.stringify({count: data.localIP.length}) + "'>" +
                    translate(local_address_key, {count: data.localIP.length}) +
                    "</span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.localIP) +
                "</td></tr>";
            transport =
                "<tr><td><span class='jitsipopover_blue' data-i18n='" +
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
                "<span class='jitsipopover_blue' data-i18n='" + key_remote +
                "' data-i18n-options='" +
                JSON.stringify({count: this.transport.length}) + "'>" +
                translate(key_remote, {count: this.transport.length}) +
                "</span></td><td>";
            localTransport += "<tr>" +
                "<td>" +
                "<span class='jitsipopover_blue' data-i18n='" + key_local +
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
                "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.transport'>" +
                translate("connectionindicator.transport") + "</span></td>" +
                "<td>" + this.transport[0].type + "</td></tr>";

        }

        result += "<table  style='width:100%'>" +
            "<tr>" +
            "<td>" +
            "<span class='jitsipopover_blue' data-i18n='connectionindicator.bandwidth'>" +
            translate("connectionindicator.bandwidth") + "</span>" +
            "</td><td>" +
            "<span class='jitsipopover_green'>&darr;</span>" +
            downloadBandwidth +
            " <span class='jitsipopover_orange'>&uarr;</span>" +
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


function createIcon(classes)
{
    var icon = document.createElement("span");
    for(var i in classes)
    {
        icon.classList.add(classes[i]);
    }
    icon.appendChild(
        document.createElement("i")).classList.add("icon-connection");
    return icon;
}

/**
 * Creates the indicator
 */
ConnectionIndicator.prototype.create = function () {
    this.connectionIndicatorContainer = document.createElement("div");
    this.connectionIndicatorContainer.className = "connectionindicator";
    this.connectionIndicatorContainer.style.display = "none";
    this.videoContainer.appendChild(this.connectionIndicatorContainer);
    this.popover = new JitsiPopover(
        $("#" + this.videoContainer.id + " > .connectionindicator"),
        {content: "<div class=\"connection_info\" data-i18n='connectionindicator.na'>" +
            APP.translation.translateString("connectionindicator.na") + "</div>",
            skin: "black"});

    this.emptyIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_empty"]));
    this.fullIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_full"]));

};

/**
 * Removes the indicator
 */
ConnectionIndicator.prototype.remove = function()
{
    this.connectionIndicatorContainer.remove();
    this.popover.forceHide();

};

/**
 * Updates the data of the indicator
 * @param percent the percent of connection quality
 * @param object the statistics data.
 */
ConnectionIndicator.prototype.updateConnectionQuality =
function (percent, object) {

    if(percent === null)
    {
        this.connectionIndicatorContainer.style.display = "none";
        this.popover.forceHide();
        return;
    }
    else
    {
        if(this.connectionIndicatorContainer.style.display == "none") {
            this.connectionIndicatorContainer.style.display = "block";
            this.videoLayout.updateMutePosition(this.videoContainer.id);
        }
    }
    this.bandwidth = object.bandwidth;
    this.bitrate = object.bitrate;
    this.packetLoss = object.packetLoss;
    this.transport = object.transport;
    if(object.resolution)
    {
        this.resolution = object.resolution;
    }
    for(var quality in ConnectionIndicator.connectionQualityValues)
    {
        if(percent >= quality)
        {
            this.fullIcon.style.width =
                ConnectionIndicator.connectionQualityValues[quality];
        }
    }
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
 * Updates the content of the popover
 */
ConnectionIndicator.prototype.updatePopoverData = function () {
    this.popover.updateContent(
        "<div class=\"connection_info\">" + this.generateText() + "</div>");
    APP.translation.translateElement($(".connection_info"));
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

module.exports = ConnectionIndicator;