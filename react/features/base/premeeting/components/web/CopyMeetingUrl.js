// @flow

import React, { Component } from 'react';

import CopyMeetingLinkSection
    from '../../../../invite/components/add-people-dialog/web/CopyMeetingLinkSection';
import { getCurrentConferenceUrl } from '../../../connection';
import { translate } from '../../../i18n';
import { connect } from '../../../redux';

type Props = {

    /**
     * The meeting url.
     */
    url: string,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Used to determine if invitation link should be automatically copied
     * after creating a meeting.
     */
    _enableAutomaticUrlCopy: boolean,
};


/**
 * Component used to copy meeting url on prejoin page.
 */
class CopyMeetingUrl extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'copy-meeting'>
                <CopyMeetingLinkSection url = { this.props.url } />
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { enableAutomaticUrlCopy } = state['features/base/config'];
    const { customizationReady } = state['features/dynamic-branding'];

    return {
        url: customizationReady ? getCurrentConferenceUrl(state) : '',
        _enableAutomaticUrlCopy: enableAutomaticUrlCopy || false
    };
}

export default connect(mapStateToProps)(translate(CopyMeetingUrl));
