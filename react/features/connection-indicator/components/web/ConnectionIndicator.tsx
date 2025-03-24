import { Theme } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { MEDIA_TYPE } from '../../../base/media/constants';
import {
    getLocalParticipant,
    getParticipantById,
    isScreenShareParticipant
} from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import {
    getTrackByMediaTypeAndParticipant,
    getVirtualScreenshareParticipantTrack
} from '../../../base/tracks/functions';
import { ITrack } from '../../../base/tracks/types';
import {
    isTrackStreamingStatusInactive,
    isTrackStreamingStatusInterrupted
} from '../../functions';
import AbstractConnectionIndicator, {
    IProps as AbstractProps,
    IState as AbstractState,
    INDICATOR_DISPLAY_THRESHOLD,
    mapStateToProps as _abstractMapStateToProps
} from '../AbstractConnectionIndicator';

import ConnectionIndicatorContent from './ConnectionIndicatorContent';
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
interface IProps extends AbstractProps, WithTranslation {

    /**
     * Disable/enable inactive indicator.
     */
    _connectionIndicatorInactiveDisabled: boolean;

    /**
     * Whether the connection status is inactive.
     */
    _isConnectionStatusInactive: boolean;

    /**
     * Whether the connection status is interrupted.
     */
    _isConnectionStatusInterrupted?: boolean;

    /**
     * Whether the indicator popover is disabled.
     */
    _popoverDisabled: boolean;

    /**
     * The participant's video track;.
     */
    _videoTrack?: ITrack;

    /**
     * Whether or not the component should ignore setting a visibility class for
     * hiding the component when the connection quality is not strong.
     */
    alwaysVisible: boolean;

    /**
     * The audio SSRC of this client.
     */
    audioSsrc?: number;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

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
}

interface IState extends AbstractState {

    /**
     * Whether popover is visible or not.
     */
    popoverVisible: boolean;
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'inline-block'
        },

        hidden: {
            display: 'none'
        },

        icon: {
            padding: '4px',
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
class ConnectionIndicator extends AbstractConnectionIndicator<IProps, IState> {
    /**
     * Initializes a new {@code ConnectionIndicator} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

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
    override render() {
        const { enableStatsDisplay, participantId, statsPopoverPosition, t } = this.props;
        const classes = withStyles.getClasses(this.props);
        const visibilityClass = this._getVisibilityClass();

        if (this.props._popoverDisabled) {
            return this._renderIndicator();
        }

        return (
            <Popover
                className = { clsx(classes.container, visibilityClass) }
                content = { <ConnectionIndicatorContent
                    inheritedStats = { this.state.stats }
                    participantId = { participantId } /> }
                disablePopover = { !enableStatsDisplay }
                headingLabel = { t('videothumbnail.connectionInfo') }
                id = 'participant-connection-indicator'
                onPopoverClose = { this._onHidePopover }
                onPopoverOpen = { this._onShowPopover }
                position = { statsPopoverPosition }
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
        const { percent } = this.state.stats;

        const {
            _isConnectionStatusInactive,
            _isConnectionStatusInterrupted,
            _connectionIndicatorInactiveDisabled
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
        const { _isConnectionStatusInactive, _isConnectionStatusInterrupted } = this.props;
        const classes = withStyles.getClasses(this.props);

        return this.state.showIndicator
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
        this.setState({ popoverVisible: false });
    }

    /**
     * Shows popover.
     *
     * @private
     * @returns {void}
     */
    _onShowPopover() {
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
            iconSize,
            t
        } = this.props;

        return (
            <div
                style = {{ fontSize: iconSize }}>
                <span className = 'sr-only'>{ t('videothumbnail.connectionInfo') }</span>
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
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantId } = ownProps;
    const tracks = state['features/base/tracks'];
    const participant = participantId ? getParticipantById(state, participantId) : getLocalParticipant(state);
    let _videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantId);

    if (isScreenShareParticipant(participant)) {
        _videoTrack = getVirtualScreenshareParticipantTrack(tracks, participantId);
    }

    const _isConnectionStatusInactive = isTrackStreamingStatusInactive(_videoTrack);
    const _isConnectionStatusInterrupted = isTrackStreamingStatusInterrupted(_videoTrack);

    return {
        ..._abstractMapStateToProps(state),
        _connectionIndicatorInactiveDisabled:
            Boolean(state['features/base/config'].connectionIndicators?.inactiveDisabled),
        _isVirtualScreenshareParticipant: isScreenShareParticipant(participant),
        _popoverDisabled: Boolean(state['features/base/config'].connectionIndicators?.disableDetails),
        _isConnectionStatusInactive,
        _isConnectionStatusInterrupted,
        _videoTrack
    };
}

export default connect(_mapStateToProps)(translate(withStyles(ConnectionIndicator, styles)));
