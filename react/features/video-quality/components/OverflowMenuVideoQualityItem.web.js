// @flow

import React, { Component } from 'react';

import { VIDEO_QUALITY_LEVELS } from '../../base/conference';
import { translate } from '../../base/i18n';
import {
    Icon,
    IconVideoQualityAudioOnly,
    IconVideoQualityHD,
    IconVideoQualityLD,
    IconVideoQualitySD
} from '../../base/icons';
import { connect } from '../../base/redux';

/**
 * A map of of selectable receive resolutions to corresponding icons.
 *
 * @private
 * @type {Object}
 */
const VIDEO_QUALITY_TO_ICON = {
    [VIDEO_QUALITY_LEVELS.HIGH]: IconVideoQualityHD,
    [VIDEO_QUALITY_LEVELS.STANDARD]: IconVideoQualitySD,
    [VIDEO_QUALITY_LEVELS.LOW]: IconVideoQualityLD
};

/**
 * The type of the React {@code Component} props of
 * {@link OverflowMenuVideoQualityItem}.
 */
type Props = {

    /**
     * Whether or not audio only mode is currently enabled.
     */
    _audioOnly: boolean,

    /**
     * The currently configured maximum quality resolution to be received from
     * and sent to remote participants.
     */
    _videoQuality: number,

    /**
     * Callback to invoke when {@link OverflowMenuVideoQualityItem} is clicked.
     */
    onClick: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} responsible for displaying a button in the overflow
 * menu of the toolbar, including an icon showing the currently selected
 * max receive quality.
 *
 * @extends Component
 */
class OverflowMenuVideoQualityItem extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _audioOnly, _videoQuality } = this.props;
        const icon = _audioOnly || !_videoQuality
            ? IconVideoQualityAudioOnly
            : VIDEO_QUALITY_TO_ICON[_videoQuality];

        return (
            <li
                aria-label =
                    { this.props.t('toolbar.accessibilityLabel.callQuality') }
                className = 'overflow-menu-item'
                onClick = { this.props.onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <Icon src = { icon } />
                </span>
                <span className = 'profile-text'>
                    { this.props.t('toolbar.callQuality') }
                </span>
            </li>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code OverflowMenuVideoQualityItem} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean,
 *     _videoQuality: number
 * }}
 */
function _mapStateToProps(state) {
    return {
        _audioOnly: state['features/base/audio-only'].enabled,
        _videoQuality: state['features/base/conference'].preferredVideoQuality
    };
}

export default translate(
    connect(_mapStateToProps)(OverflowMenuVideoQualityItem));
