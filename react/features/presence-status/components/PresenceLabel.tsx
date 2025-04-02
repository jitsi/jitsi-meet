import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { getParticipantById } from '../../base/participants/functions';
import { Text } from '../../base/react/components/index';
import { STATUS_TO_I18N_KEY } from '../constants';
import { presenceStatusDisabled } from '../functions';

/**
 * The type of the React {@code Component} props of {@link PresenceLabel}.
 */
interface IProps extends WithTranslation {

    /**
     * The current present status associated with the passed in participantID
     * prop.
     */
    _presence: string;

    /**
     * Class name for the presence label.
     */
    className: string;

    /**
     * Default presence status that will be displayed if user's presence status
     * is not available.
     */
    defaultPresence: string;

    /**
     * The ID of the participant whose presence status should display.
     */
    participantID: string;

    /**
     * Styles for the presence label.
     */
    style: Object;
}

/**
 * React {@code Component} for displaying the current presence status of a
 * participant.
 *
 * @augments Component
 */
class PresenceLabel extends Component<IProps> {
    /**
     * The default values for {@code PresenceLabel} component's property types.
     *
     * @static
     */
    static defaultProps = {
        _presence: ''
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const text = this._getPresenceText();

        if (text === null) {
            return null;
        }

        const { style, className } = this.props;

        return (
            <Text // @ts-ignore
                className = { className }
                { ...style }>
                { text }
            </Text>
        );
    }

    /**
     * Returns the text associated with the current presence status.
     *
     * @returns {string}
     */
    _getPresenceText() {
        const { _presence, t } = this.props;

        if (!_presence) {
            return null;
        }

        const i18nKey = STATUS_TO_I18N_KEY[_presence as keyof typeof STATUS_TO_I18N_KEY];

        if (!i18nKey) { // fallback to status value
            return _presence;
        }

        return t(i18nKey);
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code PresenceLabel}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The React Component props passed to the associated
 * instance of {@code PresenceLabel}.
 * @private
 * @returns {{
 *     _presence: (string|undefined)
 * }}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const participant = getParticipantById(state, ownProps.participantID);

    return {
        _presence: presenceStatusDisabled() ? ''
            : participant?.presence || ownProps.defaultPresence

    };
}

export default translate(connect(_mapStateToProps)(PresenceLabel));
