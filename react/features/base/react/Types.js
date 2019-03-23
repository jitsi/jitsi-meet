// @flow

import type { ComponentType, Element } from 'react';

/**
 * Item data for <tt>NavigateSectionList</tt>.
 */
export type Item = {

    /**
     * The avatar URL or icon name.
     */
    avatar: ?string,

    /**
     * the color base of the avatar
     */
    colorBase: string,

    /**
     * An optional react element to append to the end of the Item.
     */
    elementAfter?: ?React$Node,

    /**
     * Unique ID of the item.
     */
    id: Object | string,

    /**
     * Item title
     */
    title: string,

    /**
     * Item url
     */
    url: string,

    /**
     * lines[0] - date
     * lines[1] - duration
     * lines[2] - server name
     */
    lines: Array<string>
}

/**
 * web implementation of section data for NavigateSectionList
 */
export type Section = {

    /**
     * section title
     */
    title: string,

    /**
     * unique key for the section
     */
    key?: string,

    /**
     * Array of items in the section
     */
    data: $ReadOnlyArray<Item>,

    /**
     * Optional properties added only to fix some flow errors thrown by React
     * SectionList
     */
    ItemSeparatorComponent?: ?ComponentType<any>,

    keyExtractor?: (item: Object) => string,

    renderItem?: ?(info: Object) => ?Element<any>

}

/**
 * native implementation of section data for NavigateSectionList
 *
 * When react-native's SectionList component parses through an array of sections
 * it passes the section nested within the section property of another object
 * to the renderSection method (on web for our own implementation of SectionList
 * this nesting is not implemented as there is no need for nesting)
 */
export type SetionListSection = {
    section: Section
}
