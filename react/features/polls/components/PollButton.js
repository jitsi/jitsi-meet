// @flow

import { connect } from 'react-redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox';
import { openDialog } from '../../base/dialog';

import PollDialog from './PollDialog';

export type Props = AbstractButtonProps & {

    /**
     * Redux dispatch function.
     */
    dispatch: Function
};

/**
 * Button that opens poll dialogs.
 */
class PollButton<P: Props> extends AbstractButton<P, *> {
    iconName = 'icon-camera-take-picture';
    label = 'dialog.polls';
    showLabel = true;

    /**
     * Action handler when button is clicked.
     *
     * @inheritdoc
     */
    _handleClick() {
        this.props.dispatch(openDialog(PollDialog, {
            question: '',
            items: []
        }));
    }

    /**
     * Is button disabled.
     *
     * @inheritdoc
     */
    _isDisabled() {
        return false;
    }

    /**
     * Is button toggled.
     *
     * @inheritdoc
     */
    _isToggled() {
        return false;
    }
}

export default connect()(PollButton);
