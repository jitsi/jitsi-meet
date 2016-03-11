/*                                                                              
 * Copyright @ 2015 Atlassian Pty Ltd                                           
 *                                                                              
 * Licensed under the Apache License, Version 2.0 (the "License");              
 * you may not use this file except in compliance with the License.             
 * You may obtain a copy of the License at                                      
 *                                                                              
 *     http://www.apache.org/licenses/LICENSE-2.0                               
 *                                                                              
 * Unless required by applicable law or agreed to in writing, software          
 * distributed under the License is distributed on an "AS IS" BASIS,            
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     
 * See the License for the specific language governing permissions and          
 * limitations under the License.                                               
 */

import UIEvents from '../service/UI/UIEvents';

/**
 * The (name of the) command which transports the state (represented by
 * {State} for the local state at the time of this writing) of a {FollowMe}
 * (instance) between participants.
 */
/* private */ const _COMMAND = "follow-me";

/**
 * Represents the set of {FollowMe}-related states (properties and their
 * respective values) which are to be followed by a participant. {FollowMe}
 * will send {_COMMAND} whenever a property of {State} changes (if the local
 * participant is in her right to issue such a command, of course).
 */
/* private */ class State {
    /**
     * Initializes a new {State} instance.
     *
     * @param propertyChangeCallback {Function} which is to be called when a
     * property of the new instance has its value changed from an old value
     * into a (different) new value. The function is supplied with the name of
     * the property, the old value of the property before the change, and the
     * new value of the property after the change.
     */
    /* public */ constructor (propertyChangeCallback) {
        /* private*/ this._propertyChangeCallback = propertyChangeCallback;
    }

    /* public */ get filmStripVisible () { return this._filmStripVisible; }

    /* public */ set filmStripVisible (b) {
        var oldValue = this._filmStripVisible;
        if (oldValue !== b) {
            this._filmStripVisible = b;
            this._firePropertyChange('filmStripVisible', oldValue, b);
        }
    }

    /**
     * Invokes {_propertyChangeCallback} to notify it that {property} had its
     * value changed from {oldValue} to {newValue}.
     *
     * @param property the name of the property which had its value changed
     * from {oldValue} to {newValue}
     * @param oldValue the value of {property} before the change
     * @param newValue the value of {property} after the change
     */
    /* private */ _firePropertyChange (property, oldValue, newValue) {
        var propertyChangeCallback = this._propertyChangeCallback;
        if (propertyChangeCallback)
            propertyChangeCallback(property, oldValue, newValue);
    }
}

/**
 * Represents the &quot;Follow Me&quot; feature which enables a moderator to
 * (partially) control the user experience/interface (e.g. film strip
 * visibility) of (other) non-moderator particiapnts.
 *
 * @author Lyubomir Marinov 
 */
/* public */ class FollowMe {
    /**
     * Initializes a new {FollowMe} instance.
     *
     * @param conference the {conference} which is to transport
     * {FollowMe}-related information between participants
     * @param UI the {UI} which is the source (model/state) to be sent to
     * remote participants if the local participant is the moderator or the
     * destination (model/state) to receive from the remote moderator if the
     * local participant is not the moderator
     */
    /* public */ constructor (conference, UI) {
        /* private */ this._conference = conference;
        /* private */ this._UI = UI;

        // The states of the local participant which are to be followed (by the
        // remote participants when the local participant is in her right to
        // issue such commands).
        /* private */ this._local
            = new State(this._localPropertyChange.bind(this));

        // Listen to "Follow Me" commands. I'm not sure whether a moderator can
        // (in lib-jitsi-meet and/or Meet) become a non-moderator. If that's
        // possible, then it may be easiest to always listen to commands. The
        // listener will validate received commands before acting on them.
        conference.commands.addCommandListener(
                _COMMAND,
                this._onFollowMeCommand.bind(this));
        // Listen to (user interface) states of the local participant which are
        // to be followed (by the remote participants). A non-moderator (very
        // likely) can become a moderator so it may be easiest to always track
        // the states of interest.
        UI.addListener(
                UIEvents.TOGGLED_FILM_STRIP,
                this._filmStripToggled.bind(this));
        // TODO Listen to changes in the moderator role of the local
        // participant. When the local participant is granted the moderator
        // role, it may need to start sending "Follow Me" commands. Obviously,
        // this depends on how we decide to enable the feature at runtime as
        // well.
    }

    /**
     * Notifies this instance that the (visibility of the) film strip was
     * toggled (in the user interface of the local participant).
     *
     * @param filmStripVisible {Boolean} {true} if the film strip was shown (as
     * a result of the toggle) or {false} if the film strip was hidden
     */
    /* private */ _filmStripToggled (filmStripVisible) {
        this._local.filmStripVisible = filmStripVisible;
    }

    /* private */ _localPropertyChange (property, oldValue, newValue) {
        // Only a moderator is allowed to send commands.
        var conference = this._conference;
        if (!conference.isModerator)
            return;

        var commands = conference.commands;
        // XXX The "Follow Me" command represents a snapshot of all states
        // which are to be followed so don't forget to removeCommand before
        // sendCommand!
        commands.removeCommand(_COMMAND);
        var self = this;
        commands.sendCommand(
                _COMMAND,
                {
                    attributes: {
                        filmStripVisible: self._local.filmStripVisible,
                    },
                });
    }

    /**
     * Notifies this instance about a &qout;Follow Me&qout; command (delivered
     * by the Command(s) API of {this._conference}).
     *
     * @param attributes the attributes {Object} carried by the command
     * @param id the identifier of the participant who issued the command. A
     * notable idiosyncrasy of the Command(s) API to be mindful of here is that
     * the command may be issued by the local participant.
     */
    /* private */ _onFollowMeCommand ({ attributes }, id) {
        // We require to know who issued the command because (1) only a
        // moderator is allowed to send commands and (2) a command MUST be
        // issued by a defined commander.
        if (typeof id === 'undefined')
            return;
        // The Command(s) API will send us our own commands and we don't want
        // to act upon them.
        if (this._conference.isLocalId(id))
            return;
        // TODO Don't obey commands issued by non-moderators.

        // Apply the received/remote command to the user experience/interface
        // of the local participant.

        // filmStripVisible
        var filmStripVisible = attributes.filmStripVisible;
        if (typeof filmStripVisible !== 'undefined') {
            // XXX The Command(s) API doesn't preserve the types (of
            // attributes, at least) at the time of this writing so take into
            // account that what originated as a Boolean may be a String on
            // receipt.
            filmStripVisible = (filmStripVisible == 'true');
            // FIXME The UI (module) very likely doesn't (want to) expose its
            // eventEmitter as a public field. I'm not sure at the time of this
            // writing whether calling UI.toggleFilmStrip() is acceptable (from
            // a design standpoint) either.
            this._UI.eventEmitter.emit(
                    UIEvents.TOGGLE_FILM_STRIP,
                    filmStripVisible);
        }
    }
}

export default FollowMe;
