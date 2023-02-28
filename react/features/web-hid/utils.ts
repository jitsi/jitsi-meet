/**
 * Telephony usage actions based on HID Usage tables for Universal Serial Bus (page 112.).
 *
 */
export const TELEPHONY_DEVICE_USAGE_PAGE = 11;

/** Telephony usages
 *  - used to parse HIDDevice UsageId collections
 ** - outputReports has mute and offHook
 ** - inputReports exists hookSwitch and phoneMute.
 **/
export const DEVICE_USAGE = {
    /* outputReports. */
    mute: {
        usageId: 0x080009,
        usageName: 'Mute'
    },
    offHook: {
        usageId: 0x080017,
        usageName: 'Off Hook'
    },
    ring: {
        usageId: 0x080018,
        usageName: 'Ring'
    },
    hold: {
        usageId: 0x080020,
        usageName: 'Hold'
    },

    /* inputReports. */
    hookSwitch: {
        usageId: 0x0b0020,
        usageName: 'Hook Switch'
    },
    phoneMute: {
        usageId: 0x0b002f,
        usageName: 'Phone Mute'
    }
};

/**
 * Filter with telephony devices based on HID Usage tables for Universal Serial Bus (page 17).
 *
 * @type {{ filters: { usagePage: string }; exclusionFilters: {}; }}
 */
export const requestTelephonyHID = {
    filters: [ {
        usagePage: TELEPHONY_DEVICE_USAGE_PAGE
    } ],
    exclusionFilters: []
};
