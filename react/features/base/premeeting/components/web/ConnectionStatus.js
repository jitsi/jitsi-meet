// @flow

import React, { useCallback, useState } from 'react';

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

    const onToggleDetails = useCallback(e => {
        e.preventDefault();
        toggleDetails(!showDetails);
    }, [ showDetails, toggleDetails ]);

    const onKeyPressToggleDetails = useCallback(e => {
        if (toggleDetails && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            toggleDetails(!showDetails);
        }
    }, [ showDetails, toggleDetails ]);

    return (
        <div className = 'con-status'>
            <div className = 'con-status-container'>
                <div
                    aria-level = { 1 }
                    className = 'con-status-header'
                    role = 'heading'>
                    <div className = { `con-status-circle ${connectionClass}` }>
                        <Icon
                            size = { 16 }
                            src = { icon } />
                    </div>
                    <span
                        aria-hidden = { !showDetails }
                        className = 'con-status-text'
                        id = 'connection-status-description'>{t(connectionText)}</span>
                    <Icon
                        ariaDescribedBy = 'connection-status-description'
                        ariaPressed = { showDetails }
                        className = { arrowClassName }
                        onClick = { onToggleDetails }
                        onKeyPress = { onKeyPressToggleDetails }
                        role = 'button'
                        size = { 24 }
                        src = { IconArrowDownSmall }
                        tabIndex = { 0 } />
                </div>
                <div
                    aria-level = '2'
                    className = { `con-status-details ${detailsClassName}` }
                    role = 'heading'>
                    {detailsText}</div>
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
