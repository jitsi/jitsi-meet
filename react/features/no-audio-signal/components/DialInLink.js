// @flow

import React, { Component } from 'react';

import { connect } from '../../base/redux';
import { translate } from '../../base/i18n';
import { getDialInfoPageURL, shouldDisplayDialIn } from '../../invite';

/**
 * The type of the React {@code Component} props of {@link DialInLink}.
 */
type Props = {

    /**
     * The name of the current conference.
     */
    _room: string,

    /**
     * The current location url of the conference.
     */
    _locationURL: string,


    /**
     * The redux state representing the dial-in numbers feature.
     */
    _dialIn: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @extends Component
 */
class DialInLink extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _room, _locationURL, _dialIn, t } = this.props;

        if (!shouldDisplayDialIn(_dialIn)) {
            return null;
        }

        return (
            <div>{t('toolbar.noAudioSignalDialInDesc')}&nbsp;
                <a
                    href = {
                        getDialInfoPageURL(
                            _room,
                            _locationURL
                        )
                    }
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    {t('toolbar.noAudioSignalDialInLinkDesc')}
                </a>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DialInLink} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
    *     _room: string,
    *     _locationURL: string,
    *     _dialIn: Object,
    * }}
    */
function _mapStateToProps(state) {

    return {
        _room: state['features/base/conference'].room,
        _locationURL: state['features/base/connection'].locationURL,
        _dialIn: state['features/invite']
    };
}

export default translate(connect(_mapStateToProps)(DialInLink));
