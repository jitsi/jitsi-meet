import React, { Component } from 'react';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { removeReaction } from '../../actions.any';
import { REACTIONS } from '../../constants';

interface IProps {

    /**
     * Index of the reaction in the queue.
     */
    index: number;

    /**
     * Reaction to be displayed.
     */
    reaction: string;

    /**
     * Removes reaction from redux state.
     */
    reactionRemove: Function;

    /**
     * Id of the reaction.
     */
    uid: string;
}

interface IState {

    /**
     * Index of CSS animation. Number between 0-20.
     */
    index: number;
}


/**
 * Used to display animated reactions.
 *
 * @returns {ReactElement}
 */
class ReactionEmoji extends Component<IProps, IState> {
    /**
     * Initializes a new {@code ReactionEmoji} instance.
     *
     * @param {IProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            index: props.index % 21
        };
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        setTimeout(() => this.props.reactionRemove(this.props.uid), 5000);
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

const mapDispatchToProps = (dispatch: IStore['dispatch']) => {
    return {
        reactionRemove: (uid: string) => dispatch(removeReaction(uid))
    };
};

export default connect(undefined, mapDispatchToProps)(ReactionEmoji);
