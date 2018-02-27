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
    constructor(props) {
        super(props);

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
        const { enabled, _recentList } = this.props;

        if (!_recentList) {
            return null;
        }

        const listViewDataSource
            = this.dataSource.cloneWithRows(getRecentRooms(_recentList));

        return (
            <View
                style = { [
                    styles.container,
                    enabled ? null : styles.containerDisabled
                ] }>
                <ListView
                    dataSource = { listViewDataSource }
                    enableEmptySections = { true }
                    renderRow = { this._renderRow } />
            </View>
        );
    }

    /**
     * Assembles the style array of the avatar based on if the conference was
     * hosted on the default Jitsi Meet deployment or on a non-default one
     * (based on current app setting).
     *
     * @param {Object} recentListEntry - The recent list entry being rendered.
     * @private
     * @returns {Array<Object>}
     */
    _getAvatarStyle({ baseURL, serverName }) {
        const avatarStyles = [ styles.avatar ];

        if (baseURL !== this.props._defaultURL) {
            avatarStyles.push(this._getColorForServerName(serverName));
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
    _renderConfDuration({ durationString }) {
        if (durationString) {
            return (
                <View style = { styles.infoWithIcon } >
                    <Icon
                        name = 'timer'
                        style = { styles.inlineIcon } />
                    <Text style = { styles.confLength }>
                        { durationString }
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
                        { this._renderConfDuration(data) }
                        { this._renderServerInfo(data) }
                    </View>
                </View>
            </TouchableHighlight>
        );
    }

    /**
     * Renders the server info component based on whether the entry was on a
     * different server.
     *
     * @param {Object} recentListEntry - The recent list entry being rendered.
     * @private
     * @returns {ReactElement}
     */
    _renderServerInfo({ baseURL, serverName }) {
        if (baseURL !== this.props._defaultURL) {
            return (
                <View style = { styles.infoWithIcon } >
                    <Icon
                        name = 'public'
                        style = { styles.inlineIcon } />
                    <Text style = { styles.serverName }>
                        { serverName }
                    </Text>
                </View>
            );
        }

        return null;
    }
}

export default connect(_mapStateToProps)(RecentList);
