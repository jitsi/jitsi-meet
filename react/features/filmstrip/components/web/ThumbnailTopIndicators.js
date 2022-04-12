// @flow

import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';

import { getSourceNameSignalingFeatureFlag } from '../../../base/config';
import { isMobileBrowser } from '../../../base/environment/utils';
import ConnectionIndicator from '../../../connection-indicator/components/web/ConnectionIndicator';
import { STATS_POPOVER_POSITION, THUMBNAIL_TYPE } from '../../constants';
import { getIndicatorsTooltipPosition } from '../../functions.web';

import PinnedIndicator from './PinnedIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import StatusIndicators from './StatusIndicators';
import VideoMenuTriggerButton from './VideoMenuTriggerButton';

declare var interfaceConfig: Object;

type Props = {

    /**
     * Hide popover callback.
     */
    hidePopover: Function,

    /**
     * Class name for the status indicators container.
     */
    indicatorsClassName: string,

    /**
     * Whether or not the thumbnail is hovered.
     */
    isHovered: boolean,

    /**
     * Whether or not the thumbnail is a fake screen share participant.
     */
    isFakeScreenShareParticipant: boolean,

    /**
     * Whether or not the indicators are for the local participant.
     */
    local: boolean,

    /**
     * Id of the participant for which the component is displayed.
     */
    participantId: string,

    /**
     * Whether popover is visible or not.
     */
    popoverVisible: boolean,

    /**
     * Show popover callback.
     */
    showPopover: Function,

    /**
     * The type of thumbnail.
     */
    thumbnailType: string
}

const useStyles = makeStyles(() => {
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
    hidePopover,
    indicatorsClassName,
    isFakeScreenShareParticipant,
    isHovered,
    local,
    participantId,
    popoverVisible,
    showPopover,
    thumbnailType
}: Props) => {
    const styles = useStyles();

    const _isMobile = isMobileBrowser();
    const { NORMAL = 16 } = interfaceConfig.INDICATOR_FONT_SIZES || {};
    const _indicatorIconSize = NORMAL;
    const _connectionIndicatorAutoHideEnabled = Boolean(
        useSelector(state => state['features/base/config'].connectionIndicators?.autoHide) ?? true);
    const _connectionIndicatorDisabled = _isMobile
        || Boolean(useSelector(state => state['features/base/config'].connectionIndicators?.disabled));
    const sourceNameSignalingEnabled = useSelector(getSourceNameSignalingFeatureFlag);
    const showConnectionIndicator = isHovered || !_connectionIndicatorAutoHideEnabled;

    if (sourceNameSignalingEnabled && isFakeScreenShareParticipant) {
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

    return (
        <>
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
                    <div className = { clsx(indicatorsClassName, 'top-indicators') }>
                        <StatusIndicators
                            participantID = { participantId }
                            screenshare = { true } />
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
