// @flow

import { Component } from 'react';
import { ListView } from 'react-native';

import { appNavigate } from '../../app';
import { RECENT_URL_STORAGE } from '../../base/conference';
import { parseURIString } from '../../base/util';

/**
 * Implements a React {@link Component} which represents the list of
 * conferences recently joined, similar to how a list of last dialed
 * numbers list would do on a mobile
 *
 * @extends Component
 */
export default class AbstractRecentList extends Component < *, * > {

    /**
     * Initializes a new {@code AbstractRecentList} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor() {
        super();

        // FIXME: This has to be modified to a dynamic list later
        const ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2
        });

        this.state = {
            dataSource: ds.cloneWithRows(this._getRecentRooms())
        };
    }

    /**
    * Retreives the recent room list and generates all the data needed
    * to be displayed.
    *
    * @private
    * @returns {Object}
    */
    _getRecentRooms() {
        let recentUrls = window.localStorage.getItem(RECENT_URL_STORAGE);

        console.log('=== ZB ===: Rendering list', recentUrls);

        if (recentUrls) {
            recentUrls = JSON.parse(recentUrls);
            const recentRoomDS = [];

            recentUrls.forEach(entry => {
                const location = parseURIString(entry.conference);

                if (location && location.room && location.hostname) {
                    recentRoomDS.push({
                        conference: entry.conference,
                        room: location.room,
                        date: this._getDateString(entry.date),
                        initials: this._getInitials(location.room)
                    });
                }
            });

            return recentRoomDS.reverse();
        }

        return [];
    }

    /**
    * Returns a well formatted date string to be displayed in the list.
    *
    * @private
    * @param {number} timeStamp - The UTC timestamp to be converted to String.
    * @returns {string}
    */
    _getDateString(timeStamp: number) {
        const date = new Date(timeStamp);

        if (date.toDateString() === new Date().toDateString()) {
            // the date is today, we need to return only the time

            return date.toLocaleTimeString();
        }

        return date.toLocaleDateString();
    }

    /**
    * Returns the initials supposed to be used based on the room name.
    *
    * @private
    * @param {string} room - The room name.
    * @returns {string}
    */
    _getInitials(room: string) {
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

    /**
    *   Joins to the selected room.
    *
    * @param {string} room - The selected room.
    * @returns {void}
    */
    _onSelect(room: string) {
        if (room) {
            this.props.dispatch(appNavigate(room));
        }
    }

}
