// @flow

import { Component } from 'react';

export type Props = {

    /**
     * String or component that will be rendered as the label itself.
     */
    label: string | React$Node
};

/**
 * Abstract class for the {@code CircularLabel} component.
 */
export default class AbstractCircularLabel<P: Props, S: *>
    extends Component<P, S> {

}
