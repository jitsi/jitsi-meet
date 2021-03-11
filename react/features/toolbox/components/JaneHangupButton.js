// @flow
/* eslint-disable require-jsdoc*/

import InlineDialog from '@atlaskit/inline-dialog';
import _ from 'lodash';
import React, { Component } from 'react';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { maybeRedirectToWelcomePage } from '../../app/actions';
import { isJaneTestCall } from '../../base/conference';
import { translate } from '../../base/i18n';
import { IconHangup } from '../../base/icons';
import { Icon } from '../../base/icons/components';
import { connect } from '../../base/redux';
import { updateParticipantReadyStatus, isJaneWaitingAreaPageEnabled } from '../../jane-waiting-area/functions';

export type Props = {
    dispatch: Function,
    tooltipText: string,
    visible: boolean,
    isTestCall: boolean,
    isWaitingAreaPageEnabled: boolean
};

class JaneHangupButton extends Component<Props, State> {

    _onClick: (*) => void;

    constructor(props) {
        super(props);
        this._onClick = this._onClick.bind(this);
    }

    _hangup = _.once(props => {
        window.APP.API.notifyReadyToClose();
        sendAnalytics(createToolbarEvent('hangup'));
        props.dispatch(maybeRedirectToWelcomePage());
        window.close();
    })

    _onClick(): void {
        const { isTestCall, isWaitingAreaPageEnabled } = this.props;

        if (!isTestCall && isWaitingAreaPageEnabled) {
            updateParticipantReadyStatus('left');
        }

        this._hangup(this.props);
    }

    render(): React$Node {
        const { tooltipText, visible } = this.props;

        return visible
            ? <div className = 'jane-hangup-btn'>
                <InlineDialog
                    content = {
                        <span>
                            {
                                tooltipText
                            }
                        </span> }
                    isOpen = { tooltipText && tooltipText.length > 0 }
                    position = { 'top center' }>
                    <div className = 'jane-hangup-btn-icon'>
                        <Icon
                            onClick = { this._onClick }
                            src = { IconHangup } />
                    </div>
                </InlineDialog>
            </div> : null
        ;
    }
}

function _mapStateToProps(state) {
    return {
        isTestCall: isJaneTestCall(state),
        isWaitingAreaPageEnabled: isJaneWaitingAreaPageEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(JaneHangupButton));
