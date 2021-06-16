// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import {
    Icon,
    IconVideoQualityAudioOnly,
    IconVideoQualityHD,
    IconVideoQualityLD,
    IconVideoQualitySD
} from '../../base/icons';
import { connect } from '../../base/redux';
import { VIDEO_QUALITY_LEVELS } from '../constants';
import { findNearestQualityLevel } from '../functions';

/**
 * A map of of selectable receive resolutions to corresponding icons.
 *
 * @private
 * @type {Object}
 */
const VIDEO_QUALITY_TO_ICON = {
    [VIDEO_QUALITY_LEVELS.ULTRA]: IconVideoQualityHD,
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
     * Initializes a new {@code OverflowMenuVideoQualityItem} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (this.props.onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            this.props.onClick();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _audioOnly, _videoQuality } = this.props;
        const videoQualityLevel = findNearestQualityLevel(_videoQuality);
        const icon = _audioOnly || !videoQualityLevel
            ? IconVideoQualityAudioOnly
            : VIDEO_QUALITY_TO_ICON[videoQualityLevel];

        return (
            <li
                aria-label = { this.props.t('toolbar.accessibilityLabel.callQuality') }
                className = 'overflow-menu-item'
                onClick = { this.props.onClick }
                onKeyPress = { this._onKeyPress }
                role = 'menuitem'
                tabIndex = { 0 }>
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
        _videoQuality: state['features/video-quality'].preferredVideoQuality
    };
}

export default translate(
    connect(_mapStateToProps)(OverflowMenuVideoQualityItem));
