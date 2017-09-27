import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { kickParticipant } from '../../base/participants';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

/**
 * Implements a React {@link Component} which displays a button for kicking out
 * a participant from the conference.
 *
 * @extends Component
 */
class KickButton extends Component {
    /**
     * {@code KickButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to signal the participant with the passed in participantID
         * should be removed from the conference.
         */
        dispatch: PropTypes.func,

        /**
         * Callback to invoke when {@code KickButton} is clicked.
         */
        onClick: PropTypes.func,

        /**
         * The ID of the participant linked to the onClick callback.
         */
        participantID: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code KickButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
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
        const { participantID, t } = this.props;

        return (
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.kick') }
                iconClass = 'icon-kick'
                id = { `ejectlink_${participantID}` }
                onClick = { this._onClick } />
        );
    }

    /**
     * Remove the participant with associated participantID from the conference.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { dispatch, onClick, participantID } = this.props;

        dispatch(kickParticipant(participantID));

        if (onClick) {
            onClick();
        }
    }
}

export default translate(connect()(KickButton));
