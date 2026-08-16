import { WithTranslation } from 'react-i18next';

import { translate } from '../../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../../base/label/components/native/ExpandedLabel';

type Props = AbstractProps & WithTranslation;

/**
 * A tooltip-like expanded label explaining the meaning of the audio-translation conference label.
 */
class TranslationExpandedLabel extends ExpandedLabel<Props> {

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        return this.props.t('audioTranslation.labelTooltip');
    }
}

export default translate(TranslationExpandedLabel);
