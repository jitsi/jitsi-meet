// @flow

import { Component } from 'react';

export type Props = {

    /**
     * An SVG icon to be rendered as the content of the label.
     */
    icon: Component<any>,

    /**
     * String or component that will be rendered as the label itself.
     */
    label: string
};

/**
 * Abstract class for the {@code CircularLabel} component.
 */
export default class AbstractCircularLabel<P: Props, S: *>
    extends Component<P, S> {

}
