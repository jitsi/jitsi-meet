import { v4 as uuidv4 } from 'uuid';

import { BASE_URL, DEFAULT_CONFIG } from './constants';

/**
 * Function that creates a meeting url.
 *
 * @returns {void}
 */
export default function createMeetingUrl() {
    // eslint-disable-next-line prefer-template
    return `${BASE_URL}/${'WdioMeeting-' + uuidv4()}?${DEFAULT_CONFIG}`;
}
