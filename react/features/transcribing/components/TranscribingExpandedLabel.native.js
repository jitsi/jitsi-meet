// @flow

import { translate } from '../../base/i18n';
import { ExpandedLabel, type Props as AbstractProps } from '../../base/label';

type Props = AbstractProps & {
    t: Function
}

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code TranscribingLabel}.
 */
class TranscribingExpandedLabel extends ExpandedLabel<Props> {
    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        return this.props.t('transcribing.expandedLabel');
    }
}

export default translate(TranscribingExpandedLabel);
