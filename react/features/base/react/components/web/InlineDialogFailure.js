import React from 'react';
import AKButton from '@atlaskit/button';

import { translate } from '../../../i18n';

declare var interfaceConfig: Object;

/**
 * Inline dialog failure.
 *
 * @param {Object} props - The properties for the inline dialog.
 * @returns {XML}
 */
class InlineDialogFailure extends React.Component {
    /**
     * {@code InlineDialogFailure}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Allows to retry the call that previously didn't succeed.
         */
        onRetry: React.PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Renders the content of this component.
     *
     * @returns {XML}
     */
    render() {
        const { t } = this.props;

        const supportLink = interfaceConfig.SUPPORT_URL;
        const supportLinkElem
            = supportLink
                ? ( // eslint-disable-line no-extra-parens
                    <div className = 'inline-dialog-error-text'>
                        <span>{ t('inlineDialogFailure.part2') }</span>
                        <span>
                            <a
                                href = { supportLink }
                                rel = 'noopener noreferrer'
                                target = '_blank'>
                                { t('inlineDialogFailure.part3') }
                            </a>
                        </span>
                        <span>.</span>
                    </div>
                )
                : null;

        return (
            <div className = 'inline-dialog-error'>
                <div className = 'inline-dialog-error-text'>
                    { t('inlineDialogFailure.part1') }
                </div>
                { supportLinkElem }
                <AKButton
                    className = 'inline-dialog-error-button'
                    onClick = { this.props.onRetry } >
                    { t('inlineDialogFailure.retry') }
                </AKButton>
            </div>
        );
    }
}

export default translate(InlineDialogFailure);
