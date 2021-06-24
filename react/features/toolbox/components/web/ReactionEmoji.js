// @flow

import React, { Component } from 'react';

import { connect } from '../../../base/redux';
import { removeReaction } from '../../actions.any';
import { REACTIONS } from '../../constants';

type Props = {

    /**
     * Reaction to be displayed.
     */
    reaction: string,

    /**
     * Id of the reaction.
     */
    uid: Number,

    /**
     * Removes reaction from redux state.
     */
    removeReaction: Function,

    /**
     * Index of the reaction on the queue.
     */
    index: number
};


/**
 * Used to display animated reactions.
 *
 * @returns {ReactElement}
 */
class ReactionEmoji extends Component<Props> {
    /**
     * Initializes a new {@code ReactionEmoji} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            index: props.index % 21 // index of the CSS animation to use
        };
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        setTimeout(() => this.props.removeReaction(this.props.uid), 5000);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { reaction, uid } = this.props;
        const { index } = this.state;

        return (
            <div
                className = { `reaction-emoji reaction-${index}` }
                id = { uid }>
                { REACTIONS[reaction].emoji }
            </div>
        );
    }
}

const mapDispatchToProps = {
    removeReaction
};

export default connect(
    null,
    mapDispatchToProps,
)(ReactionEmoji);
