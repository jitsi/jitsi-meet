// @flow

import { connect } from 'react-redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import PollDialog from './PollDialog';

export type Props = AbstractButtonProps & {

    /**
     * Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * Button that opens poll dialogs.
 */
class PollButton<P: Props> extends AbstractButton<P, *> {
    label = 'dialog.polls';
    toggledLabel = 'dialog.polls';
    iconName = 'icon-polls';
    toggledIconName = 'icon-polls';

    /**
     * Action handler when button is clicked.
     *
     * @inheritdoc
     */
    _handleClick() {
        this.props.dispatch(openDialog(PollDialog));
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

export default translate(connect()(PollButton));
