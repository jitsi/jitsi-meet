/* eslint-disable react/jsx-no-bind */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../base/dialog/actions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { useCommands } from '../../commands';

const useStyles = makeStyles()(theme => {
    return {
        search: {
            backgroundColor: theme.palette.ui03,
            color: theme.palette.text01,
            ...theme.typography.bodyShortRegular,
            padding: '10px 16px',
            borderRadius: theme.shape.borderRadius,
            border: 0,
            height: '40px',
            boxSizing: 'border-box' as const,
            width: '100%',
            marginBottom: '8px',

            '&::placeholder': {
                color: theme.palette.text02
            },

            '&:focus': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.focus01}`
            }
        },

        commandItem: {
            padding: '8px 16px',
            cursor: 'pointer',
            borderRadius: `${theme.shape.borderRadius}px`,

            '&:hover, &.selected': {
                backgroundColor: theme.palette.ui03
            }
        }
    };
});

/**
 * A searchable command palette dialog that lets users quickly
 * find and execute meeting actions.
 *
 * @returns {React.ReactElement}
 */
const CommandPalette = () => {
    const { t } = useTranslation();
    const { classes, cx } = useStyles();
    const dispatch = useDispatch();
    const commands = useCommands();

    const [ query, setQuery ] = useState('');
    const [ selected, setSelected ] = useState(0);

    const filtered = query
        ? commands.filter(c => t(c.label).toLowerCase().includes(query.toLowerCase()))
        : commands;

    /**
     * Run a command and close the palette.
     *
     * @param {number} index - Index in the filtered list.
     * @returns {void}
     */
    const run = useCallback((index: number) => {
        if (index >= 0 && index < filtered.length) {
            dispatch(hideDialog());
            filtered[index].execute();
        }
    }, [ dispatch, filtered ]);

    const onQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }, []);

    const onCommandClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        run(Number(e.currentTarget.dataset.index));
    }, [ run ]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelected(s => Math.min(s + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelected(s => Math.max(s - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            run(selected);
        }
    }, [ filtered.length, run, selected ]);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            disableEnter = { true }
            hideCloseButton = { true }
            ok = {{ hidden: true }}
            titleKey = 'commandPalette.title'>
            <div onKeyDown = { onKeyDown }>
                <input
                    autoComplete = 'off'
                    autoFocus = { true }
                    className = { classes.search }
                    onChange = { onQueryChange }
                    placeholder = { t('commandPalette.placeholder') }
                    type = 'text'
                    value = { query } />
                <div>
                    {filtered.map((cmd, i) => (
                        <div
                            className = { cx(classes.commandItem, i === selected && 'selected') }
                            data-index = { i }
                            key = { cmd.id }
                            onClick = { onCommandClick }>
                            {t(cmd.label)}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div>{t('commandPalette.noResults')}</div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default CommandPalette;
