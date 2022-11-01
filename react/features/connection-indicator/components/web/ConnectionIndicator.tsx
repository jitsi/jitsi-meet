/* eslint-disable lines-around-comment */

import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { getSourceNameSignalingFeatureFlag } from '../../../base/config/functions.any';
import { translate } from '../../../base/i18n/functions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getParticipantById,
    isScreenShareParticipant
} from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import {
    getSourceNameByParticipantId,
    getTrackByMediaTypeAndParticipant,
    getVirtualScreenshareParticipantTrack
} from '../../../base/tracks/functions';
import {
    isParticipantConnectionStatusInactive,
    isParticipantConnectionStatusInterrupted,
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../functions';
import AbstractConnectionIndicator, {
    type Props as AbstractProps,
    type State as AbstractState,
    INDICATOR_DISPLAY_THRESHOLD
    // @ts-ignore
} from '../AbstractConnectionIndicator';

// @ts-ignore
import ConnectionIndicatorContent from './ConnectionIndicatorContent';
// @ts-ignore
import { ConnectionIndicatorIcon } from './ConnectionIndicatorIcon';

/**
 * An array of display configurations for the connection indicator and its bars.
 * The ordering is done specifically for faster iteration to find a matching
 * configuration to the current connection strength percentage.
 *
 * @type {Object[]}
 */
const QUALITY_TO_WIDTH: Array<{
    colorClass: string;
    percent: number;
    tip: string;
}> = [

    // Full (3 bars)
    {
        colorClass: 'status-high',
        percent: INDICATOR_DISPLAY_THRESHOLD,
        tip: 'connectionindicator.quality.good'
    },

    // 2 bars
    {
        colorClass: 'status-med',
        percent: 10,
        tip: 'connectionindicator.quality.nonoptimal'
    },

    // 1 bar
    {
        colorClass: 'status-low',
        percent: 0,
        tip: 'connectionindicator.quality.poor'
    }

    // Note: we never show 0 bars as long as there is a connection.
];

/**
 * The type of the React {@code Component} props of {@link ConnectionIndicator}.
 */
type Props = AbstractProps & WithTranslation & {

    /**
     * Disable/enable inactive indicator.
     */
    _connectionIndicatorInactiveDisabled: boolean;

    /**
     * The current condition of the user's connection, matching one of the
     * enumerated values in the library.
     */
    _connectionStatus: string;

    /**
     * Whether the indicator popover is disabled.
     */
    _popoverDisabled: boolean;

    /**
     * The source name of the track.
     */
    _sourceName: string;

    /**
     * Whether source name signaling is enabled.
     */
    _sourceNameSignalingEnabled: boolean;

    /**
     * Whether or not the component should ignore setting a visibility class for
     * hiding the component when the connection quality is not strong.
     */
    alwaysVisible: boolean;

    /**
     * The audio SSRC of this client.
     */
    audioSsrc: number;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not clicking the indicator should display a popover for more
     * details.
     */
    enableStatsDisplay: boolean;

    /**
     * The font-size for the icon.
     */
    iconSize: number;

    /**
     * Relative to the icon from where the popover for more connection details
     * should display.
     */
    statsPopoverPosition: string;
};

type State = AbstractState & {

    /**
     * Whether popover is ivisible or not.
     */
    popoverVisible: boolean;
};

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'inline-block'
        },

        hidden: {
            display: 'none'
        },

        icon: {
            padding: '6px',
            borderRadius: '4px',

            '&.status-high': {
                backgroundColor: theme.palette.success01
            },

            '&.status-med': {
                backgroundColor: theme.palette.warning01
            },

            '&.status-low': {
                backgroundColor: theme.palette.iconError
            },

            '&.status-disabled': {
                background: 'transparent'
            },

            '&.status-lost': {
                backgroundColor: theme.palette.ui05
            },

            '&.status-other': {
                backgroundColor: theme.palette.action01
            }
        },

        inactiveIcon: {
            padding: 0,
            borderRadius: '50%'
        }
    };
};

/**
 * Implements a React {@link Component} which displays the current connection
 * quality percentage and has a popover to show more detailed connection stats.
 *
 * @augments {Component}
 */
class ConnectionIndicator extends AbstractConnectionIndicator<Props, State> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // @ts-ignore
        this.state = {
            showIndicator: false,
            stats: {},
            popoverVisible: false
        };
        this._onShowPopover = this._onShowPopover.bind(this);
        this._onHidePopover = this._onHidePopover.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // @ts-ignore
        const { enableStatsDisplay, participantId, statsPopoverPosition, classes } = this.props;
        const visibilityClass = this._getVisibilityClass();

        // @ts-ignore
        if (this.props._popoverDisabled) {
            return this._renderIndicator();
        }

        return (
            <Popover
                className = { clsx(classes.container, visibilityClass) }
                content = { <ConnectionIndicatorContent
                    // @ts-ignore
                    inheritedStats = { this.state.stats }
                    participantId = { participantId } /> }
                disablePopover = { !enableStatsDisplay }
                id = 'participant-connection-indicator'
                onPopoverClose = { this._onHidePopover }
                onPopoverOpen = { this._onShowPopover }
                position = { statsPopoverPosition }
                // @ts-ignore
                visible = { this.state.popoverVisible }>
                { this._renderIndicator() }
            </Popover>
        );
    }

    /**
     * Returns a CSS class that interprets the current connection status as a
     * color.
     *
     * @private
     * @returns {string}
     */
    _getConnectionColorClass() {
        // TODO We currently do not have logic to emit and handle stats changes for tracks.
        // @ts-ignore
        const { percent } = this.state.stats;

        const {
            _isConnectionStatusInactive,
            _isConnectionStatusInterrupted,
            _connectionIndicatorInactiveDisabled
            // @ts-ignore
        } = this.props;

        if (_isConnectionStatusInactive) {
            if (_connectionIndicatorInactiveDisabled) {
                return 'status-disabled';
            }

            return 'status-other';
        } else if (_isConnectionStatusInterrupted) {
            return 'status-lost';
        } else if (typeof percent === 'undefined') {
            return 'status-high';
        }

        return this._getDisplayConfiguration(percent).colorClass;
    }

    /**
     * Get the icon configuration from QUALITY_TO_WIDTH which has a percentage
     * that matches or exceeds the passed in percentage. The implementation
     * assumes QUALITY_TO_WIDTH is already sorted by highest to lowest
     * percentage.
     *
     * @param {number} percent - The connection percentage, out of 100, to find
     * the closest matching configuration for.
     * @private
     * @returns {Object}
     */
    _getDisplayConfiguration(percent: number): any {
        return QUALITY_TO_WIDTH.find(x => percent >= x.percent) || {};
    }

    /**
     * Returns additional class names to add to the root of the component. The
     * class names are intended to be used for hiding or showing the indicator.
     *
     * @private
     * @returns {string}
     */
    _getVisibilityClass() {
        // @ts-ignore
        const { _isConnectionStatusInactive, _isConnectionStatusInterrupted, classes } = this.props;

        // @ts-ignore
        return this.state.showIndicator
            // @ts-ignore
            || this.props.alwaysVisible
            || _isConnectionStatusInterrupted
            || _isConnectionStatusInactive
            ? '' : classes.hidden;
    }

    /**
     * Hides popover.
     *
     * @private
     * @returns {void}
     */
    _onHidePopover() {
        // @ts-ignore
        this.setState({ popoverVisible: false });
    }

    /**
     * Shows popover.
     *
     * @private
     * @returns {void}
     */
    _onShowPopover() {
        // @ts-ignore
        this.setState({ popoverVisible: true });
    }


    /**
     * Creates a ReactElement for displaying the indicator (GSM bar).
     *
     * @returns {ReactElement}
     */
    _renderIndicator() {
        const {
            _isConnectionStatusInactive,
            _isConnectionStatusInterrupted,
            _connectionIndicatorInactiveDisabled,
            _videoTrack,
            classes,
            iconSize
            // @ts-ignore
        } = this.props;

        return (
            <div
                style = {{ fontSize: iconSize }}>
                <ConnectionIndicatorIcon
                    classes = { classes }
                    colorClass = { this._getConnectionColorClass() }
                    connectionIndicatorInactiveDisabled = { _connectionIndicatorInactiveDisabled }
                    isConnectionStatusInactive = { _isConnectionStatusInactive }
                    isConnectionStatusInterrupted = { _isConnectionStatusInterrupted }
                    track = { _videoTrack } />
            </div>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: IReduxState, ownProps: Props) {
    const { participantId } = ownProps;
    const tracks = state['features/base/tracks'];
    const sourceNameSignalingEnabled = getSourceNameSignalingFeatureFlag(state);
    const participant = participantId ? getParticipantById(state, participantId) : getLocalParticipant(state);

    let firstVideoTrack;

    if (sourceNameSignalingEnabled && isScreenShareParticipant(participant)) {
        firstVideoTrack = getVirtualScreenshareParticipantTrack(tracks, participantId);
    } else {
        firstVideoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantId);
    }

    const _isConnectionStatusInactive = sourceNameSignalingEnabled
        ? isTrackStreamingStatusInactive(firstVideoTrack)
        : isParticipantConnectionStatusInactive(participant);

    const _isConnectionStatusInterrupted = sourceNameSignalingEnabled
        ? isTrackStreamingStatusInterrupted(firstVideoTrack)
        : isParticipantConnectionStatusInterrupted(participant);

    return {
        _connectionIndicatorInactiveDisabled:
        Boolean(state['features/base/config'].connectionIndicators?.inactiveDisabled),
        _popoverDisabled: state['features/base/config'].connectionIndicators?.disableDetails,
        _videoTrack: firstVideoTrack,
        _isConnectionStatusInactive,
        _isConnectionStatusInterrupted,
        _sourceName: getSourceNameByParticipantId(state, participantId),
        _sourceNameSignalingEnabled: sourceNameSignalingEnabled
    };
}
export default translate(connect(_mapStateToProps)(
    // @ts-ignore
    withStyles(styles)(ConnectionIndicator)));
