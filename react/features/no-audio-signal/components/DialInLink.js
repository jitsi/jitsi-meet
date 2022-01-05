// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { getDialInfoPageURL, shouldDisplayDialIn } from '../../invite';

/**
 * The type of the React {@code Component} props of {@link DialInLink}.
 */
type Props = {

    /**
     * The redux state representing the dial-in numbers feature.
     */
    _dialIn: Object,

    /**
     * The url of the page containing the dial-in numbers list.
     */
    _dialInfoPageUrl: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @augments Component
 */
class DialInLink extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialIn, _dialInfoPageUrl, t } = this.props;

        if (!shouldDisplayDialIn(_dialIn)) {
            return null;
        }

        return (
            <div>{t('toolbar.noAudioSignalDialInDesc')}&nbsp;
                <a
                    href = { _dialInfoPageUrl }
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
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _dialIn: state['features/invite'],
        _dialInfoPageUrl: getDialInfoPageURL(state)
    };
}

export default translate(connect(_mapStateToProps)(DialInLink));
