import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { IconConnection } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getParticipantById,
    isScreenShareParticipant
} from '../../../base/participants/functions';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';
import {
    getTrackByMediaTypeAndParticipant
} from '../../../base/tracks/functions.native';
import indicatorStyles from '../../../filmstrip/components/native/styles';
import {
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../functions';
import AbstractConnectionIndicator, {
    IProps as AbstractProps,
    mapStateToProps as _abstractMapStateToProps
} from '../AbstractConnectionIndicator';

import {
    CONNECTOR_INDICATOR_COLORS,
    CONNECTOR_INDICATOR_LOST,
    CONNECTOR_INDICATOR_OTHER,
    iconStyle
} from './styles';

type IProps = AbstractProps & {

    /**
     * Whether connection indicators are disabled or not.
     */
    _connectionIndicatorDisabled: boolean;

    /**
     * Whether the inactive connection indicator is disabled or not.
     */
    _connectionIndicatorInactiveDisabled: boolean;

    /**
     * Whether the connection is inactive or not.
     */
    _isConnectionStatusInactive?: boolean;

    /**
     * Whether the connection is interrupted or not.
     */
    _isConnectionStatusInterrupted?: boolean;

    /**
     * Whether the current participant is a virtual screenshare.
     */
    _isVirtualScreenshareParticipant: boolean;

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Icon style override.
     */
    iconStyle?: any;
};

type IState = {
    autoHideTimeout: number | undefined;
    showIndicator: boolean;
    stats: any;
};

/**
 * Implements an indicator to show the quality of the connection of a participant.
 */
class ConnectionIndicator extends AbstractConnectionIndicator<IProps, IState> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            autoHideTimeout: undefined,
            showIndicator: false,
            stats: {}
        };
    }

    /**
     * Get the icon configuration from CONNECTOR_INDICATOR_COLORS which has a percentage
     * that matches or exceeds the passed in percentage. The implementation
     * assumes CONNECTOR_INDICATOR_COLORS is already sorted by highest to lowest
     * percentage.
     *
     * @param {number} percent - The connection percentage, out of 100, to find
     * the closest matching configuration for.
     * @private
     * @returns {Object}
     */
    _getDisplayConfiguration(percent: number): any {
        return CONNECTOR_INDICATOR_COLORS.find(x => percent >= x.percent) || {};
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _connectionIndicatorInactiveDisabled,
            _connectionIndicatorDisabled,
            _isVirtualScreenshareParticipant,
            _isConnectionStatusInactive,
            _isConnectionStatusInterrupted
        } = this.props;
        const {
            showIndicator,
            stats
        } = this.state;
        const { percent } = stats;

        if (!showIndicator || typeof percent === 'undefined'
                || _connectionIndicatorDisabled || _isVirtualScreenshareParticipant) {
            return null;
        }

        let indicatorColor;

        if (_isConnectionStatusInactive) {
            if (_connectionIndicatorInactiveDisabled) {
                return null;
            }

            indicatorColor = CONNECTOR_INDICATOR_OTHER;
        } else if (_isConnectionStatusInterrupted) {
            indicatorColor = CONNECTOR_INDICATOR_LOST;
        } else {
            const displayConfig = this._getDisplayConfiguration(percent);

            if (!displayConfig) {
                return null;
            }

            indicatorColor = displayConfig.color;
        }

        return (
            <View
                style = { [
                    indicatorStyles.indicatorContainer as StyleProp<ViewStyle>,
                    { backgroundColor: indicatorColor }
                ] }>
                <BaseIndicator
                    icon = { IconConnection }
                    iconStyle = { this.props.iconStyle || iconStyle } />
            </View>
        );
    }

}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantId } = ownProps;
    const tracks = state['features/base/tracks'];
    const participant = participantId ? getParticipantById(state, participantId) : getLocalParticipant(state);
    const _isVirtualScreenshareParticipant = isScreenShareParticipant(participant);
    let _isConnectionStatusInactive;
    let _isConnectionStatusInterrupted;

    if (!_isVirtualScreenshareParticipant) {
        const _videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantId);

        _isConnectionStatusInactive = isTrackStreamingStatusInactive(_videoTrack);
        _isConnectionStatusInterrupted = isTrackStreamingStatusInterrupted(_videoTrack);
    }

    return {
        ..._abstractMapStateToProps(state),
        _connectionIndicatorInactiveDisabled:
            Boolean(state['features/base/config'].connectionIndicators?.inactiveDisabled),
        _connectionIndicatorDisabled:
            Boolean(state['features/base/config'].connectionIndicators?.disabled),
        _isVirtualScreenshareParticipant,
        _isConnectionStatusInactive,
        _isConnectionStatusInterrupted
    };
}

export default connect(_mapStateToProps)(ConnectionIndicator);
