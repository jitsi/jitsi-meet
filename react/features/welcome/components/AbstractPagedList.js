// @flow

import { Component } from 'react';

/**
 * The page to be displayed on render.
 */
export const DEFAULT_PAGE = 0;

type Props = {

    /**
     * Indicates if the list is disabled or not.
     */
    disabled: boolean,

    /**
     * The i18n translate function
     */
    t: Function
}

type State = {

    /**
     * The currently selected page.
     */
    pageIndex: number
}

/**
 * Abstract class for the platform specific paged lists.
 */
export default class AbstractPagedList extends Component<Props, State> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            pageIndex: DEFAULT_PAGE
        };
    }

}
