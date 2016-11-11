/* global $, config, interfaceConfig */
const logger = require("jitsi-meet-logger").getLogger(__filename);

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
        logger.info(
            "Send config request to " + endpoint + " for room: " + roomName);


        $.ajax(
            endpoint,
            {
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({"roomName": roomName}),
                dataType: 'json',
                error: function(jqXHR, textStatus, errorThrown) {
                    logger.error("Get config error: ", jqXHR, errorThrown);
                    var error = "Get config response status: " + textStatus;
                    complete(false, error);
                },
                success: function(data) {
                    try {
                        configUtil.overrideConfigJSON(
                            config, interfaceConfig, data);
                        complete(true);
                        return;
                    } catch (exception) {
                        logger.error("Parse config error: ", exception);
                        complete(false, exception);
                    }
                }
            }
        );
    }
};

module.exports = HttpConfig;
