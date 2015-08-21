/* global $, $iq, config, interfaceConfig */

var configUtil = require('./Util');

var HttpConfig = {
    /**
     * Sends HTTP POST request to specified <tt>endpoint</tt>. In request
     * the name of the room is included in JSON format:
     * {
     *   "rooomName": "someroom12345"
     * }
     * @param endpoint the name of HTTP endpoint to which HTTP POST request will
     *                 be sent.
     * @param roomName the name of the conference room for which config will be
     *                 requested.
     * @param complete
     */
    obtainConfig: function (endpoint, roomName, complete) {
        console.info(
            "Send config request to " + endpoint + " for room: " + roomName);

        var request = new XMLHttpRequest();
        var error = null;
        request.onreadystatechange = function (aEvt) {
            if (request.readyState == 4) {
                var status = request.status;
                if (status === 200) {
                    try {
                        var data = JSON.parse(request.responseText);
                        configUtil.overrideConfigJSON(
                            config, interfaceConfig, data);
                        complete(true);
                        return;
                    } catch (exception) {
                        console.error("Parse config error: ", exception);
                        error = exception;
                    }
                } else {
                    console.error("Get config error: ", request, status);
                    error = "Get config response status: " + status;
                }
                complete(false, error);
            }
        };

        request.open("POST", endpoint, true);

        request.setRequestHeader(
            "Content-Type", "application/json;charset=UTF-8");

        request.send({ "roomName": roomName });
    }
};

module.exports = HttpConfig;