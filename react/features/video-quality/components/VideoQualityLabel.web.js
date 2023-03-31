// @flow

import React from 'react';
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { IconPerformance } from '../../base/icons/svg';
import Label from '../../base/label/components/web/Label';
import { COLORS } from '../../base/label/constants';
import Tooltip from '../../base/tooltip/components/Tooltip';
import { shouldDisplayTileView } from '../../video-layout/functions.web';

import AbstractVideoQualityLabel, {
    IProps as AbstractProps,
    _abstractMapStateToProps
} from './AbstractVideoQualityLabel';
import VideoQualityDialog from './VideoQualityDialog.web';

declare var interfaceConfig: Object;

type Props = AbstractProps & {

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * The message to show within the label's tooltip.
     */
    _tooltipKey: string,

    /**
     * Flag controlling visibility of the component.
     */
    _visible: boolean,
};

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the displayed video state of the current conference. {@code AudioOnlyLabel}
 * Will display when the conference is in audio only mode. {@code HDVideoLabel}
 * Will display if not in audio only mode and a high-definition large video is
 * being displayed.
 */
export class VideoQualityLabel extends AbstractVideoQualityLabel<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _audioOnly,
            _visible,
            dispatch,
            t
        } = this.props;


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
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code VideoQualityLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _visible: !(shouldDisplayTileView(state) || interfaceConfig.VIDEO_QUALITY_LABEL_DISABLED)
    };
}

export default translate(connect(_mapStateToProps)(VideoQualityLabel));
