// @flow

import { translate } from '../../../i18n';
import { connect } from '../../../redux';

import { _abstractMapStateToProps } from '../../functions';

import { type Props as BaseProps } from './BaseDialog';
import BaseSubmitDialog from './BaseSubmitDialog';

type Props = BaseProps & {
    t: Function
}

/**
 * Implements a submit dialog component that can have free content.
 */
class CustomSubmitDialog extends BaseSubmitDialog<Props, *> {
    /**
     * Implements {@code BaseSubmitDialog._renderSubmittable}.
     *
     * @inheritdoc
     */
    _renderSubmittable() {
        return this.props.children;
    }
}

export default translate(
    connect(_abstractMapStateToProps)(CustomSubmitDialog));
