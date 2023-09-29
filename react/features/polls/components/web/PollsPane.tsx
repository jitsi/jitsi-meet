import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Button from '../../../base/ui/components/web/Button';
import AbstractPollsPane, { AbstractProps } from '../AbstractPollsPane';

import PollCreate from './PollCreate';
import PollsList from './PollsList';
/* eslint-enable lines-around-comment */

const useStyles = makeStyles()(() => {
    return {
        container: {
            height: '100%',
            position: 'relative'
        },
        listContainer: {
            height: 'calc(100% - 88px)',
            overflowY: 'auto'
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            padding: '24px',
            width: '100%',
            boxSizing: 'border-box'
        }
    };
});

const PollsPane = ({ createMode, onCreate, setCreateMode, t }: AbstractProps) => {
    const { classes } = useStyles();

    return createMode
        ? <PollCreate setCreateMode = { setCreateMode } />
        : <div className = { classes.container }>
            <div className = { classes.listContainer } >
                <PollsList />
            </div>
            <div className = { classes.footer }>
                <Button
                    accessibilityLabel = { t('polls.create.create') }
                    fullWidth = { true }
                    labelKey = { 'polls.create.create' }
                    onClick = { onCreate } />
            </div>
        </div>;
};

/*
 * We apply AbstractPollsPane to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollsPane(PollsPane);
