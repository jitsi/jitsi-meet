// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { VIDEO_QUALITY_LEVELS } from '../../base/conference';
import { translate } from '../../base/i18n';

/**
 * A map of of selectable receive resolutions to corresponding icons.
 *
 * @private
 * @type {Object}
 */
const VIDEO_QUALITY_TO_ICON = {
    [VIDEO_QUALITY_LEVELS.HIGH]: 'icon-HD',
    [VIDEO_QUALITY_LEVELS.STANDARD]: 'icon-SD',
    [VIDEO_QUALITY_LEVELS.LOW]: 'icon-LD'
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
     * remote participants.
     */
    _receiveVideoQuality: number,

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
        const { _audioOnly, _receiveVideoQuality } = this.props;
        const icon = _audioOnly || !_receiveVideoQuality
            ? 'icon-AUD'
            : VIDEO_QUALITY_TO_ICON[_receiveVideoQuality];

        return (
            <li
                aria-label =
                    { this.props.t('toolbar.accessibilityLabel.callQuality') }
                className = 'overflow-menu-item'
                onClick = { this.props.onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <i className = { icon } />
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
 *     _receiveVideoQuality: number
 * }}
 */
function _mapStateToProps(state) {
    return {
        _audioOnly: state['features/base/conference'].audioOnly,
        _receiveVideoQuality:
            state['features/base/conference'].receiveVideoQuality
    };
}

export default translate(
    connect(_mapStateToProps)(OverflowMenuVideoQualityItem));
