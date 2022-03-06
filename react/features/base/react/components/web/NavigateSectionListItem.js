// @flow

import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { Component } from 'react';

import type { Item } from '../../Types';

import Container from './Container';
import Text from './Text';

/**
 * The type of the React {@code Component} props of
 * {@link NavigateSectionListItem}.
 */
type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * Function to be invoked when an item is pressed. The item's URL is passed.
     */
    onPress: ?Function,

    /**
     * A item containing data to be rendered.
     */
    item: Item
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    const listTileText = {
        ...theme.mixins.navigateSectionlistText,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        float: 'left'
    };

    return {
        root: {
            backgroundColor: '#1754A9',
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'inline-flex',
            marginBottom: '8px',
            marginRight: '8px',
            minHeight: '100px',
            padding: '16px',
            width: '100%',
            '.&.with-click-handler': {
                cursor: 'pointer'
            },

            '&.with-click-handler:hover': {
                backgroundColor: '#1a5dbb'
            },

            '& i': {
                cursor: 'inherit'
            },

            '& .element-after': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            },

            '& .join-button': {
                display: 'none'
            },

            '&:hover .join-button': {
                display: 'block'
            }
        },
        listTileInfo: {
            flex: 1,
            wordBreak: 'break-word'
        },
        tileBody: {
            ...listTileText,
            fontWeight: 'normal',
            lineHeight: '24px'
        },
        tileTitle: {
            ...listTileText,
            fontWeight: 'bold',
            lineHeight: '24px'
        }
    };
};

/**
 * Implements a React/Web {@link Component} for displaying an item in a
 * NavigateSectionList.
 *
 * @augments Component
 */
class NavigateSectionListItem<P: Props>
    extends Component<P> {

    /**
     * Renders the content of this component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { classes, elementAfter, lines, title } = this.props.item;
        const { onPress } = this.props;

        /**
         * Initializes the date and duration of the conference to the an empty
         * string in case for some reason there is an error where the item data
         * lines doesn't contain one or both of those values (even though this
         * unlikely the app shouldn't break because of it).
         *
         * @type {string}
         */
        let date = '';
        let duration = '';

        if (lines[0]) {
            date = lines[0];
        }
        if (lines[1]) {
            duration = lines[1];
        }

        return (
            <Container
                className = { clsx(classes.root, { 'with-click-handler': onPress }) }
                onClick = { onPress }>
                <Container className = { classes.listTileInfo }>
                    <Text
                        className = { classes.tileTitle }>
                        { title }
                    </Text>
                    <Text
                        className = { classes.tileBody }>
                        { date }
                    </Text>
                    <Text
                        className = { classes.tileBody }>
                        { duration }
                    </Text>
                </Container>
                <Container className = { 'element-after' }>
                    { elementAfter || null }
                </Container>
            </Container>
        );
    }
}

export default withStyles(styles)(NavigateSectionListItem);
