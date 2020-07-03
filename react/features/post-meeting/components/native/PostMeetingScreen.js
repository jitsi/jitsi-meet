// @flow

import React, { PureComponent } from 'react';
import WebView from 'react-native-webview';

import { appNavigate } from '../../../app/actions';
import { getDefaultURL } from '../../../app/functions';
import { JitsiModal } from '../../../base/modal';
import { connect } from '../../../base/redux';
import { POST_MEETING_MODAL_ID } from '../../constants';
import { getClosePage } from '../../functions';

type Props = {

    /**
     * The URL of the close page (post meeting page).
     */
    _closePageURL: string,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function
}

/**
 * Component to implement a screen that appears post meeting, when necessary.
 */
class PostMeetingScreen extends PureComponent<Props> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClose = this._onClose.bind(this);
    }

    /**
     * Implements PureComponent#render.
     *
     * @inheritdoc
     */
    render() {
        return (
            <JitsiModal
                headerProps = {{
                    headerLabelKey: 'postMeeting.title'
                }}
                modalId = { POST_MEETING_MODAL_ID }
                onClose = { this._onClose }>
                <WebView source = {{ uri: this.props._closePageURL }} />
            </JitsiModal>
        );
    }

    _onClose: () => boolean;

    /**
     * Callback to be invoked on closing the modal.
     *
     * @returns {void}
     */
    _onClose() {
        this.props.dispatch(appNavigate(undefined));

        return true;
    }
}

/**
 * Maops part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    return {
        _closePageURL: new URL(getClosePage(), getDefaultURL(state)).toString()
    };
}

export default connect(_mapStateToProps)(PostMeetingScreen);
