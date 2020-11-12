// @flow
/* eslint-disable */

import React, { Component } from 'react';
import InlineDialog from '@atlaskit/inline-dialog';
import { Icon } from '../../base/icons/components';
import { IconHangup, IconClose } from '../../base/icons';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import _ from 'lodash';
import { maybeRedirectToWelcomePage } from '../../app';

export type Props = {
    showTooltip: boolean,
    dispatch: Function,
    tooltipText: string,
    hasCloseBtn: boolean,
    visible: boolean
};

type State = {
    showTooltip: boolean,
};

class JaneHangupButton extends Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = {
            showTooltip: props.showTooltip || false
        };
    }

    tooltipIsClosedByUser = false;

    _hangup = _.once(() => {
        window.APP.API.notifyReadyToClose();
        window.APP.store.dispatch(maybeRedirectToWelcomePage());
        window.close();
    });

    static getDerivedStateFromProps(props, state) {
        if (props.showTooltip !== state.showTooltip) {
            return {
                showTooltip: props.showTooltip
            };
        }
        return null;
    }

    _onClick(): void {
        this._hangup();
    }

    _onCloseIconClick(): void {
        this.setState({
            showTooltip: false
        }, () => {
            this.tooltipIsClosedByUser = true;
        });
    }

    render(): React$Node {
        const { tooltipText, hasCloseBtn, visible } = this.props;

        return (visible ?
                <div className="jane-hangup-btn">
                    <InlineDialog
                        content={
                            <span>
                            {
                                tooltipText
                            }
                                {
                                    hasCloseBtn && <Icon
                                        className='tooltip-close-icon'
                                        src={IconClose}
                                        size={14}
                                        onClick={this._onCloseIconClick.bind(this)}
                                    />
                                }
                        </span>}
                        isOpen={this.state.showTooltip && !this.tooltipIsClosedByUser}
                        position={'top center'}>
                        <div className="jane-hangup-btn-icon">
                            <Icon
                                src={IconHangup}
                                onClick={this._onClick.bind(this)}/>
                        </div>
                    </InlineDialog>
                </div> : null
        );
    }
}

export default translate(connect()(JaneHangupButton));
