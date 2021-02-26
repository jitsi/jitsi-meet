/* @flow */

import React, { Component } from 'react';

import { getConferenceName } from '../../../base/conference/functions';
import { getParticipantCount } from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import ConferenceTimer from '../ConferenceTimer';

import ParticipantsCount from './ParticipantsCount';

/**
 * The type of the React {@code Component} props of {@link Subject}.
 */
type Props = {

    /**
     * Whether the conference timer should be shown or not.
     */
    _hideConferenceTimer: Boolean,

    /**
     * Whether the participant count should be shown or not.
     */
    _showParticipantCount: boolean,

    /**
     * Whether the conference subject should be shown or not.
     */
    _showSubject: boolean,

    /**
     * The subject or the of the conference.
     * Falls back to conference name.
     */
    _subject: string,

    /**
     * Indicates whether the component should be visible or not.
     */
    _visible: boolean
};

/**
 * Subject react component.
 *
 * @class Subject
 */
class Subject extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _hideConferenceTimer, _showParticipantCount, _showSubject, _subject, _visible } = this.props;
        let className = `subject ${_visible ? 'visible' : ''}`;

        if (!_hideConferenceTimer || _showParticipantCount || _showSubject) {
            className += ' gradient';
        }

        return (
            <div className = { className }>
                { _showSubject && <span className = 'subject-text'>{ _subject }</span>}
                { _showParticipantCount && <ParticipantsCount /> }
                { !_hideConferenceTimer && <ConferenceTimer /> }
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code Subject}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _hideConferenceTimer: boolean,
 *     _showParticipantCount: boolean,
 *     _showSubject: boolean,
 *     _subject: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const participantCount = getParticipantCount(state);
    const { hideConferenceTimer, hideConferenceSubject, hideParticipantsStats } = state['features/base/config'];

    return {
        _hideConferenceTimer: Boolean(hideConferenceTimer),
        _showParticipantCount: participantCount > 2 && !hideParticipantsStats,
        _showSubject: !hideConferenceSubject,
        _subject: getConferenceName(state),
        _visible: isToolboxVisible(state) && participantCount > 1
    };
}

export default connect(_mapStateToProps)(Subject);
