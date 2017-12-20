// @flow

import { Component } from 'react';
import { ListView } from 'react-native';

import { appNavigate } from '../../app';

import { getRecentRooms } from '../functions';

/**
 * The type of the React {@code Component} props of {@link AbstractRecentList}
 */
type Props = {

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: Dispatch<*>
};

/**
 * The type of the React {@code Component} state of {@link AbstractRecentList}.
 */
type State = {

    /**
     * The {@code ListView.DataSource} to be used for the {@code ListView}. Its
     * content comes from the native implementation of
     * {@code window.localStorage}.
     */
    dataSource: Object
};

/**
 * Implements a React {@link Component} which represents the list of conferences
 * recently joined, similar to how a list of last dialed numbers list would do
 * on a mobile device.
 *
 * @extends Component
 */
export default class AbstractRecentList extends Component<Props, State> {

    /**
     * The datasource that backs the {@code ListView}.
     */
    listDataSource = new ListView.DataSource({
        rowHasChanged: (r1, r2) =>
            r1.conference !== r2.conference
                && r1.dateTimeStamp !== r2.dateTimeStamp
    });

    /**
     * Initializes a new {@code AbstractRecentList} instance.
     */
    constructor() {
        super();

        this.state = {
            dataSource: this.listDataSource.cloneWithRows([])
        };
    }

    /**
     * Implements React's {@link Component#componentWillMount()}. Invoked
     * immediately before mounting occurs.
     *
     * @inheritdoc
     */
    componentWillMount() {
        // The following must be done asynchronously because we don't have the
        // storage initiated on app startup immediately.
        getRecentRooms()
            .then(rooms =>
                this.setState({
                    dataSource: this.listDataSource.cloneWithRows(rooms)
                }));
    }

    /**
     * Joins the selected room.
     *
     * @param {string} room - The selected room.
     * @returns {void}
     */
    _onJoin(room) {
        room && this.props.dispatch(appNavigate(room));
    }

    /**
     * Creates a bound onPress action for the list item.
     *
     * @param {string} room - The selected room.
     * @returns {Function}
     */
    _onSelect(room) {
        return this._onJoin.bind(this, room);
    }
}
