// @flow

import React from 'react';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractKnockingParticipantList, { mapStateToProps } from '../AbstractKnockingParticipantList';

/**
 * Component to render a list for the actively knocking participants.
 */
class KnockingParticipantList extends AbstractKnockingParticipantList {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, _toolboxVisible, _visible, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <div
                className = { _toolboxVisible ? 'toolbox-visible' : '' }
                id = 'knocking-participant-list'>
                <span className = 'title'>
                    Knocking participant list
                </span>
                <ul>
                    { _participants.map(p => (
                        <li key = { p.id }>
                            <Avatar
                                displayName = { p.name }
                                size = { 48 }
                                url = { p.loadableAvatarUrl } />
                            <div className = 'details'>
                                <span>
                                    { p.name }
                                </span>
                                { p.email && (
                                    <span>
                                        { p.email }
                                    </span>
                                ) }
                            </div>
                            <button
                                className = 'primary'
                                onClick = { this._onRespondToParticipant(p.id, true) }
                                type = 'button'>
                                { t('lobby.allow') }
                            </button>
                            <button
                                className = 'borderLess'
                                onClick = { this._onRespondToParticipant(p.id, false) }
                                type = 'button'>
                                { t('lobby.reject') }
                            </button>
                        </li>
                    )) }
                </ul>
            </div>
        );
    }

    _onRespondToParticipant: (string, boolean) => Function;
}

export default translate(connect(mapStateToProps)(KnockingParticipantList));
