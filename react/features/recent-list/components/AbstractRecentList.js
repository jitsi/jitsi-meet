// @flow

import { Component } from 'react';
import { ListView } from 'react-native';

import { getRecentRooms } from '../functions';

import { appNavigate } from '../../app';

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

        const ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) =>
                r1.conference !== r2.conference && r1.timeStamp !== r2.timeStamp
        });

        this.state = {
            dataSource: ds.cloneWithRows([])
        };

        getRecentRooms(rooms => {
            this.setState({
                dataSource: ds.cloneWithRows(rooms)
            });
        });
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
