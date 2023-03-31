import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { isScreenShareParticipantById } from '../../../base/participants/functions';
import ConnectionIndicator from '../../../connection-indicator/components/web/ConnectionIndicator';
import { STATS_POPOVER_POSITION, THUMBNAIL_TYPE } from '../../constants';
import { getIndicatorsTooltipPosition } from '../../functions.web';

import PinnedIndicator from './PinnedIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import StatusIndicators from './StatusIndicators';
import VideoMenuTriggerButton from './VideoMenuTriggerButton';

interface IProps {

    /**
     * Whether to hide the connection indicator.
     */
    disableConnectionIndicator?: boolean;

    /**
     * Hide popover callback.
     */
    hidePopover?: Function;

    /**
     * Class name for the status indicators container.
     */
    indicatorsClassName?: string;

    /**
     * Whether or not the thumbnail is hovered.
     */
    isHovered: boolean;

    /**
     * Whether or not the indicators are for the local participant.
     */
    local?: boolean;

    /**
     * Id of the participant for which the component is displayed.
     */
    participantId: string;

    /**
     * Whether popover is visible or not.
     */
    popoverVisible?: boolean;

    /**
     * Show popover callback.
     */
    showPopover?: Function;

    /**
     * The type of thumbnail.
     */
    thumbnailType: string;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            display: 'flex',

            '& > *:not(:last-child)': {
                marginRight: '4px'
            }
        }
    };
});

const ThumbnailTopIndicators = ({
    disableConnectionIndicator,
    hidePopover,
    indicatorsClassName,
    isHovered,
    local,
    participantId,
    popoverVisible,
    showPopover,
    thumbnailType
}: IProps) => {
    const { classes: styles, cx } = useStyles();

    const _isMobile = isMobileBrowser();
    const { NORMAL = 16 } = interfaceConfig.INDICATOR_FONT_SIZES || {};
    const _indicatorIconSize = NORMAL;
    const _connectionIndicatorAutoHideEnabled = Boolean(
        useSelector((state: IReduxState) => state['features/base/config'].connectionIndicators?.autoHide) ?? true);
    const _connectionIndicatorDisabled = _isMobile || disableConnectionIndicator
        || Boolean(useSelector((state: IReduxState) => state['features/base/config'].connectionIndicators?.disabled));
    const showConnectionIndicator = isHovered || !_connectionIndicatorAutoHideEnabled;
    const isVirtualScreenshareParticipant = useSelector(
        (state: IReduxState) => isScreenShareParticipantById(state, participantId)
    );

    if (isVirtualScreenshareParticipant) {
        return (
            <div className = { styles.container }>
                {!_connectionIndicatorDisabled
                    && <ConnectionIndicator
                        alwaysVisible = { showConnectionIndicator }
                        enableStatsDisplay = { true }
                        iconSize = { _indicatorIconSize }
                        participantId = { participantId }
                        statsPopoverPosition = { STATS_POPOVER_POSITION[thumbnailType] } />
                }
            </div>
        );
    }

    const tooltipPosition = getIndicatorsTooltipPosition(thumbnailType);

    return (<>
        <div className = { styles.container }>
            <PinnedIndicator
                iconSize = { _indicatorIconSize }
                participantId = { participantId }
                tooltipPosition = { tooltipPosition } />
            {!_connectionIndicatorDisabled
                && <ConnectionIndicator
                    alwaysVisible = { showConnectionIndicator }
                    enableStatsDisplay = { true }
                    iconSize = { _indicatorIconSize }
                    participantId = { participantId }
                    statsPopoverPosition = { STATS_POPOVER_POSITION[thumbnailType] } />
            }
            <RaisedHandIndicator
                iconSize = { _indicatorIconSize }
                participantId = { participantId }
                tooltipPosition = { tooltipPosition } />
            {thumbnailType !== THUMBNAIL_TYPE.TILE && (
                <div className = { cx(indicatorsClassName, 'top-indicators') }>
                    <StatusIndicators
                        participantID = { participantId }
                        screenshare = { false } />
                </div>
            )}
        </div>
        <div className = { styles.container }>
            <VideoMenuTriggerButton
                hidePopover = { hidePopover }
                local = { local }
                participantId = { participantId }
                popoverVisible = { popoverVisible }
                showPopover = { showPopover }
                thumbnailType = { thumbnailType }
                visible = { isHovered } />
        </div>
    </>);
};

export default ThumbnailTopIndicators;
