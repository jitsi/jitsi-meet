// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';

type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: String,

    /**
     * Additional class name for custom styles.
     */
    className?: string,

    /**
     * Children of the component.
     */
    children: string | React$Node,

    /**
     * Button id.
     */
    id?: string,

    /**
     * Click handler
     */
    onClick: Function,

    /**
     * Whether or not the button should have primary button style.
     */
    primary?: boolean
}

const useStyles = makeStyles(theme => {
    return {
        button: {
            alignItems: 'center',
            backgroundColor: theme.palette.action02,
            border: 0,
            borderRadius: `${theme.shape.borderRadius}px`,
            display: 'flex',
            justifyContent: 'center',
            minHeight: '40px',
            padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`,
            ...theme.typography.labelButton,
            lineHeight: `${theme.typography.labelButton.lineHeight}px`,

            '&:hover': {
                backgroundColor: theme.palette.action02Hover
            },

            [`@media (max-width: ${participantsPaneTheme.MD_BREAKPOINT})`]: {
                ...theme.typography.labelButtonLarge,
                lineHeight: `${theme.typography.labelButtonLarge.lineHeight}px`,
                minWidth: '48px',
                minHeight: '48px'
            }
        },

        buttonPrimary: {
            backgroundColor: theme.palette.action01,

            '&:hover': {
                backgroundColor: theme.palette.action01Hover
            }
        }
    };
});

const ParticipantPaneBaseButton = ({
    accessibilityLabel,
    className,
    children,
    id,
    onClick,
    primary = false
}: Props) => {
    const styles = useStyles();

    return (
        <button
            aria-label = { accessibilityLabel }
            className = { `${styles.button} ${primary ? styles.buttonPrimary : ''} ${className ?? ''}` }
            id = { id }
            onClick = { onClick }>
            {children}
        </button>
    );
};

export default ParticipantPaneBaseButton;
