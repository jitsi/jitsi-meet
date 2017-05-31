const logger = require("jitsi-meet-logger").getLogger(__filename);

/**
 * The modules stores information about the URL used to start the conference and
 * provides utility methods for dealing with conference URL and reloads.
 */
export default class ConferenceUrl {
    /**
     * Initializes the module.
     *
     * @param location an object which stores provides the info about conference
     * URL(would be 'window.location' for the Web app). The params below are
     * described based on the following example URL:
     *
     * https://example.com:8888/SomeConference1245?opt=1#somehash
     *
     * @param location.href full URL with all parameters, would be the whole URL
     * from the example string above.
     * @param location.host the host part of the URL, 'example.com' from
     * the sample URL above.
     * @param location.pathname the path part of the URL, would be
     * '/SomeConference1245' from the example above.
     * @param location.protocol the protocol part of the URL, would be 'https:'
     * from the sample URL.
     */
    constructor(location) {
        logger.info("Stored original conference URL: " + location.href);
        logger.info(
                "Conference URL for invites: " + location.protocol + "//"
                    + location.host + location.pathname);
    }
}
