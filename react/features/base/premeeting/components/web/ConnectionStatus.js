// @flow

import React, { useState } from 'react';

import { translate } from '../../../i18n';
import { Icon, IconArrowDownSmall, IconWifi1Bar, IconWifi2Bars, IconWifi3Bars } from '../../../icons';
import { connect } from '../../../redux';
import { CONNECTION_TYPE } from '../../constants';
import { getConnectionData } from '../../functions';

type Props = {

    /**
     * List of strings with details about the connection.
     */
    connectionDetails: string[],

    /**
     * The type of the connection. Can be: 'none', 'poor', 'nonOptimal' or 'good'.
     */
    connectionType: string,

    /**
     * Used for translation.
     */
    t: Function
}

const CONNECTION_TYPE_MAP = {
    [CONNECTION_TYPE.POOR]: {
        connectionClass: 'con-status--poor',
        icon: IconWifi1Bar,
        connectionText: 'prejoin.connection.poor'
    },
    [CONNECTION_TYPE.NON_OPTIMAL]: {
        connectionClass: 'con-status--non-optimal',
        icon: IconWifi2Bars,
        connectionText: 'prejoin.connection.nonOptimal'
    },
    [CONNECTION_TYPE.GOOD]: {
        connectionClass: 'con-status--good',
        icon: IconWifi3Bars,
        connectionText: 'prejoin.connection.good'
    }
};

/**
 * Component displaying information related to the connection & audio/video quality.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function ConnectionStatus({ connectionDetails, t, connectionType }: Props) {
    if (connectionType === CONNECTION_TYPE.NONE) {
        return null;
    }

    const { connectionClass, icon, connectionText } = CONNECTION_TYPE_MAP[connectionType];
    const [ showDetails, toggleDetails ] = useState(false);
    const arrowClassName = showDetails
        ? 'con-status-arrow con-status-arrow--up'
        : 'con-status-arrow';
    const detailsText = connectionDetails.map(t).join(' ');
    const detailsClassName = showDetails
        ? 'con-status-details-visible'
        : 'con-status-details-hidden';

    return (
        <div className = 'con-status'>
            <div className = 'con-status-container'>
                <div className = 'con-status-header'>
                    <div className = { `con-status-circle ${connectionClass}` }>
                        <Icon
                            size = { 16 }
                            src = { icon } />
                    </div>
                    <span className = 'con-status-text'>{t(connectionText)}</span>
                    <Icon
                        className = { arrowClassName }
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick = { () => toggleDetails(!showDetails) }
                        size = { 24 }
                        src = { IconArrowDownSmall } />
                </div>
                <div className = { `con-status-details ${detailsClassName}` }>{detailsText}</div>
            </div>
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    const { connectionDetails, connectionType } = getConnectionData(state);

    return {
        connectionDetails,
        connectionType
    };
}

export default translate(connect(mapStateToProps)(ConnectionStatus));
