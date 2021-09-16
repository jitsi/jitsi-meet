// @flow
/* eslint-disable require-jsdoc*/

import InlineDialog from '@atlaskit/inline-dialog';
import _ from 'lodash';
import React, { Component } from 'react';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { disconnect } from '../../base/connection';
import { translate } from '../../base/i18n';
import { IconHangup } from '../../base/icons';
import { Icon } from '../../base/icons/components';
import { connect } from '../../base/redux';

export type Props = {
    dispatch: Function,
    tooltipText: string,
    visible: boolean,
    isTestCall: boolean,
    isWaitingAreaPageEnabled: boolean
};

class JaneHangupButton extends Component<Props> {

    _onClick: (*) => void;

    constructor(props) {
        super(props);
        this._onClick = this._onClick.bind(this);
    }

    _hangup = _.once(props => {
        window.APP.API.notifyReadyToClose();
        sendAnalytics(createToolbarEvent('hangup'));
        props.dispatch(disconnect(false));
    })

    _onClick(): void {
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

export default translate(connect()(JaneHangupButton));
