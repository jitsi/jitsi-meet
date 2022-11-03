import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import { isMobileBrowser } from '../../../environment/utils';
import { withPixelLineHeight } from '../../../styles/functions.web';

interface ITabProps {
    accessibilityLabel: string;
    onChange: (id: string) => void;
    selected: string;
    tabs: Array<{
        accessibilityLabel: string;
        countBadge?: number;
        disabled?: boolean;
        id: string;
        label: string;
    }>;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            display: 'flex'
        },

        tab: {
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            color: theme.palette.text02,
            flex: 1,
            padding: '14px',
            background: 'none',
            border: 0,
            appearance: 'none',
            borderBottom: `2px solid ${theme.palette.ui05}`,
            transition: 'color, border-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 0,

            '&:hover': {
                color: theme.palette.text01,
                borderColor: theme.palette.ui10
            },

            '&:focus': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}`,
                border: 0,
                color: theme.palette.text01
            },

            '&.selected': {
                color: theme.palette.text01,
                borderColor: theme.palette.action01
            },

            '&:disabled': {
                color: theme.palette.text03,
                borderColor: theme.palette.ui05
            },

            '&.is-mobile': {
                ...withPixelLineHeight(theme.typography.bodyShortBoldLarge)
            }
        },

        badge: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.text04,
            padding: `0 ${theme.spacing(1)}`,
            borderRadius: '100%',
            backgroundColor: theme.palette.warning01,
            marginLeft: theme.spacing(2)
        }
    };
});


const Tabs = ({
    tabs,
    onChange,
    selected,
    accessibilityLabel
}: ITabProps) => {
    const { classes, cx } = useStyles();
    const isMobile = isMobileBrowser();

    const handleChange = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        onChange(e.currentTarget.id);
    }, []);

    return (
        <div
            aria-label = { accessibilityLabel }
            className = { classes.container }
            role = 'tablist'>
            {tabs.map(tab => (
                <button
                    aria-label = { tab.accessibilityLabel }
                    aria-selected = { selected === tab.id }
                    className = { cx(classes.tab, selected === tab.id && 'selected', isMobile && 'is-mobile') }
                    disabled = { tab.disabled }
                    id = { tab.id }
                    key = { tab.id }
                    onClick = { handleChange }
                    role = 'tab'>
                    {tab.label}
                    {tab.countBadge && <span className = { classes.badge }>{tab.countBadge}</span>}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
