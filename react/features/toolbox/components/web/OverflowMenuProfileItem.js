/* globals interfaceConfig */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    Avatar,
    getAvatarURL,
    getLocalParticipant
} from '../../../base/participants';

/**
 * A React {@code Component} for displaying a link with a profile avatar as an
 * icon.
 *
 * @extends Component
 */
class OverflowMenuProfileItem extends Component {
    /**
     * {@code OverflowMenuProfileItem}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The redux representation of the local participant.
         */
        _localParticipant: PropTypes.object,

        /**
         * Whether the button support clicking or not.
         */
        _unclickable: PropTypes.bool,

        /**
         * The callback to invoke when {@code OverflowMenuProfileItem} is
         * clicked.
         */
        onClick: PropTypes.func
    };

    /**
     * Initializes a new {@code OverflowMenuProfileItem} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _localParticipant, _unclickable } = this.props;
        const classNames = `overflow-menu-item ${
            _unclickable ? 'unclickable' : ''}`;
        const avatarURL = getAvatarURL(_localParticipant);
        let displayName;

        if (_localParticipant && _localParticipant.name) {
            displayName = _localParticipant.name.split(' ')[0];
        } else {
            displayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
        }

        return (
            <li
                aria-label = 'Edit your profile'
                className = { classNames }
                onClick = { this._onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <Avatar uri = { avatarURL } />
                </span>
                <span className = 'profile-text'>
                    { displayName }
                </span>
            </li>
        );
    }

    /**
     * Invokes an on click callback if clicking is allowed.
     *
     * @returns {void}
     */
    _onClick() {
        if (!this.props._unclickable) {
            this.props.onClick();
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code OverflowMenuProfileItem} component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _localParticipant: Object,
 *     _unclickable: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _localParticipant: getLocalParticipant(state),
        _unclickable: !state['features/base/jwt'].isGuest
            || !interfaceConfig.SETTINGS_SECTIONS.includes('profile')
    };
}

export default connect(_mapStateToProps)(OverflowMenuProfileItem);
