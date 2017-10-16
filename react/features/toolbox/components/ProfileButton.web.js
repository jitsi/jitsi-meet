/* @flow */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { sendAnalyticsEvent } from '../../analytics';
import { DEFAULT_AVATAR_RELATIVE_PATH } from '../../base/participants';
import UIEvents from '../../../../service/UI/UIEvents';

import ToolbarButton from './ToolbarButton';

declare var APP: Object;

/**
 * The default configuration for the button.
 *
 * @type {Object}
 */
const DEFAULT_BUTTON_CONFIGURATION = {
    buttonName: 'profile',
    classNames: [ 'button' ],
    enabled: true,
    id: 'toolbar_button_profile',
    tooltipKey: 'profile.setDisplayNameLabel'
};

/**
 * React {@code Component} for the profile button.
 *
 * @extends Component
 */
class ProfileButton extends Component {
    _onClick: Function;

    /**
     * {@code ProfileButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether the button support clicking or not.
         */
        _unclickable: PropTypes.bool,

        /**
         * Whether the side panel is opened or not.
         */
        toggled: PropTypes.bool,

        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Initializes a new {@code ProfileButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _unclickable, tooltipPosition, toggled } = this.props;
        const buttonConfiguration = {
            ...DEFAULT_BUTTON_CONFIGURATION,
            unclickable: _unclickable,
            toggled
        };

        return (
            <ToolbarButton
                button = { buttonConfiguration }
                onClick = { this._onClick }
                tooltipPosition = { tooltipPosition }>
                <img
                    id = 'avatar'
                    src = { DEFAULT_AVATAR_RELATIVE_PATH } />
            </ToolbarButton>
        );
    }

    /**
     * Click handler for the button.
     *
     * @returns {void}
     */
    _onClick() {
        if (!this.props._unclickable) {
            sendAnalyticsEvent('toolbar.profile.toggled');
            APP.UI.emitEvent(UIEvents.TOGGLE_PROFILE);
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code ProfileButton}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _unclickable: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _unclickable: !state['features/base/jwt'].isGuest
    };
}

export default connect(_mapStateToProps)(ProfileButton);
