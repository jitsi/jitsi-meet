// @flow

import React, { PureComponent } from 'react';
import WebView from 'react-native-webview';

import { JitsiModal } from '../../base/modal';
import { connect } from '../../base/redux';
import { HELP_VIEW_MODAL_ID } from '../constants';

const DEFAULT_HELP_CENTRE_URL = 'https://web-cdn.jitsi.net/faq/meet-faq.html';

type Props = {

    /**
     * The URL to display in the Help Centre.
     */
    _url: string
}

/**
 * Implements a page that renders the help content for the app.
 */
class HelpView extends PureComponent<Props> {
    /**
     * Implements {@code PureComponent#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <JitsiModal
                headerProps = {{
                    headerLabelKey: 'helpView.header'
                }}
                modalId = { HELP_VIEW_MODAL_ID }>
                <WebView source = {{ uri: this.props._url }} />
            </JitsiModal>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _url: state['features/base/config'].helpCentreURL || DEFAULT_HELP_CENTRE_URL
    };
}

export default connect(_mapStateToProps)(HelpView);
