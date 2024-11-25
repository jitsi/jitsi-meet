import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../styles/functions.web';
import Button from '../../../ui/components/web/Button';
import { getSupportUrl } from '../../functions';

const useStyles = makeStyles()(theme => {
    return {
        dialog: {
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${Number(theme.shape.borderRadius)}px`,
            boxShadow: '0px 1px 2px rgba(41, 41, 41, 0.25)',
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            padding: `${theme.spacing(3)} 10`,
            '& .retry-button': {
                margin: '16px auto 0 auto'
            }
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link InlineDialogFailure}.
 */
interface IProps {

    /**
     * Allows to retry the call that previously didn't succeed.
     */
    onRetry: Function;

    /**
     * Indicates whether the support link should be shown in case of an error.
     */
    showSupportLink: Boolean;
}

/**
 * Inline dialog that represents a failure and allows a retry.
 *
 * @returns {Element}
 */
const InlineDialogFailure = ({
    onRetry,
    showSupportLink
}: IProps) => {
    const { t } = useTranslation();
    const { classes } = useStyles();

    const supportLink = useSelector(getSupportUrl);
    const supportString = t('inlineDialogFailure.supportMsg');
    const supportLinkElem = supportLink && showSupportLink
        ? (
            <div>
                <span>{ supportString.padEnd(supportString.length + 1) }
                </span>
                <span>
                    <a
                        href = { supportLink }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        { t('inlineDialogFailure.support') }
                    </a>
                </span>
                <span>.</span>
            </div>
        )
        : null;

    return (
        <div className = { classes.dialog }>
            <div>
                { t('inlineDialogFailure.msg') }
            </div>
            { supportLinkElem }
            <Button
                className = 'retry-button'
                label = { t('inlineDialogFailure.retry') }
                onClick = { onRetry } />
        </div>
    );
};

export default InlineDialogFailure;
