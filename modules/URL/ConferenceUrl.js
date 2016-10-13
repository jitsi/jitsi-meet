
import { redirect } from '../util/helpers';

/**
 * Stores the original conference room URL with all parameters.
 * @type {string}
 */
let originalURL;

/**
 * A simplified version of the conference URL stripped out of the parameters
 * which should be used for sending invites.
 * @type {string}
 */
let inviteURL;

/**
 * The modules stores information about the URL used to start the conference and
 * provides utility methods for dealing with conference URL and reloads.
 */
export default {
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
     *
     * @param location.host the host part of the URL, 'example.com' from
     * the sample URL above.
     *
     * @param location.pathname the path part of the URL, would be
     * '/SomeConference1245' from the example above.
     *
     * @param location.protocol the protocol part of the URL, would be 'https:'
     * from the sample URL.
     */
    init(location) {
        originalURL = location.href;
        // "https:" + "//" + "example.com:8888" + "/SomeConference1245"
        inviteURL
            = location.protocol + "//" + location.host + location.pathname;
        console.info("Stored original conference URL: " + originalURL);
        console.info("Conference URL for invites: " + inviteURL);
    },
    /**
     * Obtains the conference invite URL.
     * @return {string} the URL pointing o the conference which is mean to be
     * used to invite new participants.
     */
    getInviteUrl() {
        return inviteURL;
    },
    /**
     * Obtains full conference URL with all original parameters.
     * @return {string} the original URL used to open the current conference.
     */
    getOriginalUrl() {
        return originalURL;
    },
    /**
     * Reloads the conference using original URL with all of the parameters.
     */
    reload() {
        console.info("Reloading the conference using URL: " + originalURL);
        redirect(originalURL);
    }
};
