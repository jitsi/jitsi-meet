/* @flow */

import { RECENT_URL_STORAGE } from './constants';
import { parseURIString } from '../base/util';


/**
* Retreives the recent room list and generates all the data needed
* to be displayed.
*
* @param {Function} cb - The callback to be executed when the list is available.
* @returns {void}
*/
export function getRecentRooms(cb: Function) {
    window.localStorage.getItemAsync(RECENT_URL_STORAGE, recentUrls => {

        if (recentUrls) {
            const recentUrlsObj = JSON.parse(recentUrls);
            const recentRoomDS = [];

            recentUrlsObj.forEach(entry => {
                const location = parseURIString(entry.conference);

                if (location && location.room && location.hostname) {
                    recentRoomDS.push({
                        conference: entry.conference,
                        dateTimeStamp: entry.date,
                        dateString: _getDateString(entry.date),
                        initials: _getInitials(location.room),
                        room: location.room
                    });
                }
            });

            cb(recentRoomDS.reverse());
        } else {
            cb([]);
        }
    });
}

/**
* Returns a well formatted date string to be displayed in the list.
*
* @param {number} dateTimeStamp - The UTC timestamp to be converted to String.
* @returns {string}
*/
function _getDateString(dateTimeStamp: number) {
    const date = new Date(dateTimeStamp);

    if (date.toDateString() === new Date().toDateString()) {
        // the date is today, we need to return only the time

        return date.toLocaleTimeString();
    }

    return date.toLocaleDateString();
}

/**
* Returns the initials supposed to be used based on the room name.
*
* @param {string} room - The room name.
* @returns {string}
*/
function _getInitials(room: string) {
    let initials = room.charAt(0);

    const initialGenerators = [
        word => {
            // 2rd or later capital
            for (let i = 1; i < word.length; i++) {
                const l = word.charAt(i);

                if (l && l === l.toUpperCase() && l !== l.toLowerCase()) {
                    return l;
                }
            }

            return '';
        },
        word => {
            // something after a defined set of separators
            for (let i = 1; i < word.length; i++) {
                const l = word.charAt(i);

                if (l && '._'.indexOf(l) !== -1 && word.charAt(i + 1)) {
                    return word.charAt(i + 1);
                }
            }

            return '';
        }

        // TODO: list further generators here
    ];

    // applying initial generators as long as the length
    // of the initials is 2

    initialGenerators.forEach(gen => {
        if (initials.length < 2) {
            initials += gen(room);
        }
    });

    return initials;
}
