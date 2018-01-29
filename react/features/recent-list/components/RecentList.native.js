import React from 'react';
import { ListView, Text, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';

import { Icon } from '../../base/font-icons';

import AbstractRecentList, { _mapStateToProps } from './AbstractRecentList';
import { getRecentRooms } from '../functions';
import styles, { UNDERLAY_COLOR } from './styles';

/**
 * The native container rendering the list of the recently joined rooms.
 *
 * @extends AbstractRecentList
 */
class RecentList extends AbstractRecentList {
    /**
     * The datasource wrapper to be used for the display.
     */
    dataSource = new ListView.DataSource({
        rowHasChanged: (r1, r2) =>
            r1.conference !== r2.conference
                && r1.dateTimeStamp !== r2.dateTimeStamp
    });

    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor() {
        super();

        // Bind event handlers so they are only bound once per instance.
        this._getAvatarStyle = this._getAvatarStyle.bind(this);
        this._onSelect = this._onSelect.bind(this);
        this._renderConfDuration = this._renderConfDuration.bind(this);
        this._renderRow = this._renderRow.bind(this);
        this._renderServerInfo = this._renderServerInfo.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}. Renders a list of recently
     * joined rooms.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props || !this.props._recentList) {
            return null;
        }

        const listViewDataSource
            = this.dataSource.cloneWithRows(
                getRecentRooms(this.props._recentList));

        return (
            <View style = { styles.container }>
                <ListView
                    dataSource = { listViewDataSource }
                    enableEmptySections = { true }
                    renderRow = { this._renderRow } />
            </View>
        );
    }

    /**
     * Assembles the style array of the avatar based on if the conference was a
     * home or remote server conference (based on current app setting).
     *
     * @param {Object} recentListEntry - The recent list entry being rendered.
     * @private
     * @returns {Array<Object>}
     */
    _getAvatarStyle(recentListEntry) {
        const avatarStyles = [ styles.avatar ];

        if (recentListEntry.baseURL !== this.props._homeServer) {
            avatarStyles.push(
                this._getColorForServerName(recentListEntry.serverName));
        }

        return avatarStyles;
    }

    /**
     * Returns a style (color) based on the server name, so then the same server
     * will always be rendered with the same avatar color.
     *
     * @param {string} serverName - The recent list entry being rendered.
     * @private
     * @returns {Object}
     */
    _getColorForServerName(serverName) {
        let nameHash = 0;

        for (let i = 0; i < serverName.length; i++) {
            nameHash += serverName.codePointAt(i);
        }

        return styles[`avatarRemoteServer${(nameHash % 5) + 1}`];
    }

    /**
     * Renders the conference duration if available.
     *
     * @param {Object} recentListEntry - The recent list entry being rendered.
     * @private
     * @returns {ReactElement}
     */
    _renderConfDuration({ conferenceDurationString }) {
        if (conferenceDurationString) {
            return (
                <View style = { styles.infoWithIcon } >
                    <Icon
                        name = 'timer'
                        style = { styles.inlineIcon } />
                    <Text style = { styles.confLength }>
                        { conferenceDurationString }
                    </Text>
                </View>
            );
        }

        return null;
    }

    /**
     * Renders the server info component based on if the entry was on a
     * different server or not.
     *
     * @param {Object} recentListEntry - The recent list entry being rendered.
     * @private
     * @returns {ReactElement}
     */
    _renderServerInfo(recentListEntry) {
        if (recentListEntry.baseURL !== this.props._homeServer) {
            return (
                <View style = { styles.infoWithIcon } >
                    <Icon
                        name = 'public'
                        style = { styles.inlineIcon } />
                    <Text style = { styles.serverName }>
                        { recentListEntry.serverName }
                    </Text>
                </View>
            );
        }

        return null;
    }

    /**
     * Renders the list of recently joined rooms.
     *
     * @param {Object} data - The row data to be rendered.
     * @private
     * @returns {ReactElement}
     */
    _renderRow(data) {
        return (
            <TouchableHighlight
                onPress = { this._onSelect(data.conference) }
                underlayColor = { UNDERLAY_COLOR } >
                <View style = { styles.row } >
                    <View style = { styles.avatarContainer } >
                        <View style = { this._getAvatarStyle(data) } >
                            <Text style = { styles.avatarContent }>
                                { data.initials }
                            </Text>
                        </View>
                    </View>
                    <View style = { styles.detailsContainer } >
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.roomName }>
                            { data.room }
                        </Text>
                        <View style = { styles.infoWithIcon } >
                            <Icon
                                name = 'event_note'
                                style = { styles.inlineIcon } />
                            <Text style = { styles.date }>
                                { data.dateString }
                            </Text>
                        </View>
                        {
                            this._renderConfDuration(data)
                        }
                        {
                            this._renderServerInfo(data)
                        }
                    </View>
                </View>
            </TouchableHighlight>
        );
    }
}

export default connect(_mapStateToProps)(RecentList);
