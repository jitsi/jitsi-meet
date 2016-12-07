import { Component } from 'react';

/**
 * Implements a React Component which depicts a specific participant's avatar
 * and video.
 */
export default class ParticipantView extends Component {

   /**
    * Implements React's {@link Component#render()}.
    *
    * @inheritdoc
    * @returns {ReactElement|null}
    */
    render() {
        // FIXME ParticipantView is supposed to be platform-independent.
        // Temporarily though, ParticipantView is not in use on Web but has to
        // exist in order to split App, Conference, and WelcomePage out of
        // index.html.
        return null;
    }
 }
