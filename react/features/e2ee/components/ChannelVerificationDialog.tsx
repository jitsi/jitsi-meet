import React, { PureComponent } from 'react';

import { IState, IStore } from "../../app/types";
import { hideDialog } from '../../base/dialog/actions';
import { connect } from '../../base/redux/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import { channelVerified } from '../actions';


interface Props {
    dispatch: IStore['dispatch'];
    sas: object;
    pId: string;
    decimal: string;
    emoji: string;
}

/**
 * Class for the dialog displayed for E2EE sas verification.
 */
export class ChannelVerificationDialog extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onConfirmed = this._onConfirmed.bind(this);
        this._onDismissed = this._onDismissed.bind(this);
    }

    render() {
        const { decimal, emoji } =  this.props.sas
        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.verifyChannelDismiss' }}
                ok = {{ translationKey: 'dialog.verifyChannelConfirm' }}
                onCancel = { this._onDismissed }
                onSubmit = { this._onConfirmed }
                titleKey = 'dialog.verifyChannelTitle'>
                <div>
                    { emoji }
                </div>
            </Dialog>
        );
    }

    _onDismissed() {
        console.log("XXX middleware dismissed")
        this.props.dispatch(hideDialog(undefined));
        this.props.dispatch(channelVerified(false, this.props.pId));
        return true;
    }
    
    _onConfirmed() {
        console.log("XXX middleware confirmed")
        this.props.dispatch(hideDialog(undefined));
        this.props.dispatch(channelVerified(true, this.props.pId));
        return true;
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {IState} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: IState, ownProps: Props) {
    return {
        sas: ownProps.sas,
        pId: ownProps.pId
    };
}

export default connect(_mapStateToProps)(ChannelVerificationDialog);
