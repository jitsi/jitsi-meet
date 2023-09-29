import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../../base/icons/components/Icon';
import { IconArrowDown } from '../../../../base/icons/svg';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';

interface IProps {

    /**
     * Country object of the entry.
     */
    country: { code: string; dialCode: string; name: string; };

    /**
     * Click handler for the selector.
     */
    onClick: () => void;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: theme.palette.ui01,
            borderRight: `1px solid ${theme.palette.ui03}`,
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            position: 'relative',
            width: '88px',
            borderTopLeftRadius: theme.shape.borderRadius,
            borderBottomLeftRadius: theme.shape.borderRadius
        },

        text: {
            flexGrow: 1
        },

        flag: {
            marginRight: theme.spacing(2)
        }
    };
});

/**
 * This component displays the country selector with the flag.
 *
 * @returns {ReactElement}
 */
function CountrySelector({ country: { code, dialCode }, onClick }: IProps) {
    const { classes, cx } = useStyles();

    const onKeyPressHandler = useCallback(e => {
        if (onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    return (
        <div
            className = { classes.container }
            onClick = { onClick }
            onKeyPress = { onKeyPressHandler }>
            <div className = { cx(classes.flag, 'iti-flag', code) } />
            <span className = { classes.text }>{`+${dialCode}`}</span>
            <Icon
                size = { 16 }
                src = { IconArrowDown } />
        </div>
    );
}

export default CountrySelector;
