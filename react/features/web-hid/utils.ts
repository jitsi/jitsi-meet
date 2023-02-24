/**
 * Telephony usage actions based on HID Usage tables for Universal Serial Bus (page 112.).
 *
 */
export const TELEPHONY_DEVICE_USAGE_PAGE = 11;

/**
 * Telephony usage actions based on HID Usage tables for Universal Serial Bus (page 112.).
 *
 * @type {{ TELEPHONY_MUTE: number; HOOK_SWITCH: number; DROP: number; LED_MUTE: number; LED_OFFHOOK: number; }}
 */
export const TELEPHONY_USAGE_ACTIONS = {
    TELEPHONY_MUTE: 720943,
    HOOK_SWITCH: 720928,
    DROP: 720934,
    LED_MUTE: 524297,
    LED_OFFHOOK: 524311
};

/**
 * Filter with telephony devices based on HID Usage tables for Universal Serial Bus (page 17).
 *
 * @type {{ filters: {}; exclusionFilters: {}; }}
 */
export const requestTelephonyHID = {
    filters: [
        { usagePage: 11 }
    ],
    exclusionFilters: [
        {
            // Blue Microphones
            productId: 40580,
            vendorId: 46478
        }
    ]
};

/**
 * Decode data received from hid device event.
 *
 * @param {number} reportSize - .
 * @param {Uint8Array} bufferArray - .
 * @returns {number} .
 */
export function decode(reportSize: number, bufferArray: Uint8Array) {
    // eslint-disable-next-line no-bitwise
    return (bufferArray[Math.floor(reportSize / 8)] >> reportSize % 8) & 1;
}

/**
 * Encode actions for hid device.
 *
 * @param {number[]} reportSizeList -.
 * @param {number[]} telephonyActionResultList -.
 * @param {number} data -.
 * @returns {Uint8Array}
 */
export function encode(reportSizeList: number[], telephonyActionResultList: number[], data: number) {
    const dataArray = new Uint8Array(data);

    for (let d = 0; d < reportSizeList.length; d++) {
        const e = reportSizeList[d],
            f = Math.floor(e / 8);

        // eslint-disable-next-line no-bitwise
        dataArray[f] = (telephonyActionResultList[d] << e % 8) | (dataArray[f] ? dataArray[f] : 0);
    }

    return dataArray;
}

/**
 *  Map telephony usage number to report id.
 *
 * @param {number} id - .
 * @returns {number}
 */
export function mapTelephonyUsageToReportId(id: number) {
    switch (id) {
    case TELEPHONY_USAGE_ACTIONS.TELEPHONY_MUTE:
    case TELEPHONY_USAGE_ACTIONS.LED_MUTE:
        return 0;
    case TELEPHONY_USAGE_ACTIONS.LED_OFFHOOK:
        return 2;
    case TELEPHONY_USAGE_ACTIONS.HOOK_SWITCH:
        return 3;
    case TELEPHONY_USAGE_ACTIONS.DROP:
        return 4;
    default:
        return id;
    }
}
