// @flow

import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import ConnectionIndicator from '../../../connection-indicator/components/web/ConnectionIndicator';
import { LAYOUTS } from '../../../video-layout';
import { STATS_POPOVER_POSITION } from '../../constants';
import { getIndicatorsTooltipPosition } from '../../functions.web';

import PinnedIndicator from './PinnedIndicator';
import RaisedHandIndicator from './RaisedHandIndicator';
import StatusIndicators from './StatusIndicators';
import VideoMenuTriggerButton from './VideoMenuTriggerButton';

declare var interfaceConfig: Object;

type Props = {

    /**
     * The current layout of the filmstrip.
     */
    currentLayout: string,

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
    showPopover: Function
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
    currentLayout,
    hidePopover,
    indicatorsClassName,
    isHovered,
    local,
    participantId,
    popoverVisible,
    showPopover
}: Props) => {
    const styles = useStyles();

    const _isMobile = isMobileBrowser();
    const { NORMAL = 16 } = interfaceConfig.INDICATOR_FONT_SIZES || {};
    const _indicatorIconSize = NORMAL;
    const _connectionIndicatorAutoHideEnabled = Boolean(
        useSelector(state => state['features/base/config'].connectionIndicators?.autoHide) ?? true);
    const _connectionIndicatorDisabled = _isMobile
        || Boolean(useSelector(state => state['features/base/config'].connectionIndicators?.disabled));

    const showConnectionIndicator = isHovered || !_connectionIndicatorAutoHideEnabled;

    return (
        <>
            <div className = { styles.container }>
                <PinnedIndicator
                    iconSize = { _indicatorIconSize }
                    participantId = { participantId }
                    tooltipPosition = { getIndicatorsTooltipPosition(currentLayout) } />
                {!_connectionIndicatorDisabled
                    && <ConnectionIndicator
                        alwaysVisible = { showConnectionIndicator }
                        enableStatsDisplay = { true }
                        iconSize = { _indicatorIconSize }
                        participantId = { participantId }
                        statsPopoverPosition = { STATS_POPOVER_POSITION[currentLayout] } />
                }
                <RaisedHandIndicator
                    iconSize = { _indicatorIconSize }
                    participantId = { participantId }
                    tooltipPosition = { getIndicatorsTooltipPosition(currentLayout) } />
                {currentLayout !== LAYOUTS.TILE_VIEW && (
                    <div className = { clsx(indicatorsClassName, 'top-indicators') }>
                        <StatusIndicators
                            participantID = { participantId }
                            screenshare = { true } />
                    </div>
                )}
            </div>
            <div className = { styles.container }>
                <VideoMenuTriggerButton
                    currentLayout = { currentLayout }
                    hidePopover = { hidePopover }
                    local = { local }
                    participantId = { participantId }
                    popoverVisible = { popoverVisible }
                    showPopover = { showPopover }
                    visible = { isHovered } />
            </div>
        </>);
};

export default ThumbnailTopIndicators;
