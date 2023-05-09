import { WithTranslation } from 'react-i18next';

import { translate } from '../../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../../base/label/components/native/ExpandedLabel';

type Props = AbstractProps & WithTranslation;

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code RaisedHandsCountExpandedLabel}.
 */
class RaisedHandsCountExpandedLabel extends ExpandedLabel<Props> {

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        return this.props.t('raisedHandsLabel');
    }
}

export default translate(RaisedHandsCountExpandedLabel);
