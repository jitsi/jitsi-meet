import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { IconPerformance } from '../../base/icons/svg';
import Label from '../../base/label/components/web/Label';
import { COLORS } from '../../base/label/constants';
import Tooltip from '../../base/tooltip/components/Tooltip';
import { shouldDisplayTileView } from '../../video-layout/functions.web';

import VideoQualityDialog from './VideoQualityDialog.web';

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference. {@code AudioOnlyLabel}
 * Will display when the conference is in audio only mode. {@code HDVideoLabel}
 * Will display if not in audio only mode and a high-definition large video is
 * being displayed.
 *
 * @returns {JSX}
 */
const VideoQualityLabel = () => {
    const _audioOnly = useSelector((state: IReduxState) => state['features/base/audio-only'].enabled);
    const _visible = useSelector((state: IReduxState) => !(shouldDisplayTileView(state)
        || interfaceConfig.VIDEO_QUALITY_LABEL_DISABLED));
    const dispatch = useDispatch();
    const { t } = useTranslation();

    if (!_visible) {
        return null;
    }

    let className, icon, labelContent, tooltipKey;

    if (_audioOnly) {
        className = 'audio-only';
        labelContent = t('videoStatus.audioOnly');
        tooltipKey = 'videoStatus.labelTooltipAudioOnly';
    } else {
        className = 'current-video-quality';
        icon = IconPerformance;
        tooltipKey = 'videoStatus.performanceSettings';
    }

    const onClick = () => dispatch(openDialog(VideoQualityDialog));

    return (
        <Tooltip
            content = { t(tooltipKey) }
            position = { 'bottom' }>
            <Label
                accessibilityText = { t(tooltipKey) }
                className = { className }
                color = { COLORS.white }
                icon = { icon }
                iconColor = '#fff'
                id = 'videoResolutionLabel'
                // eslint-disable-next-line react/jsx-no-bind
                onClick = { onClick }
                text = { labelContent } />
        </Tooltip>
    );
};

export default VideoQualityLabel;
