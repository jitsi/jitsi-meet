// @flow

import { connect } from '../../../redux';
import { _abstractMapStateToProps } from '../../functions';

import BaseDialog, { type Props } from './BaseDialog';

/**
 * Implements a custom dialog component, where the content can freely be
 * rendered.
 */
class CustomDialog extends BaseDialog<Props, *> {
    /**
     * Implements {@code BaseDialog._renderContent}.
     *
     * @inheritdoc
     */
    _renderContent() {
        return this.props.children;
    }
}

export default connect(_abstractMapStateToProps)(CustomDialog);
