/* global $, JitsiMeetJs */

const NEW_TRACK_EVENT = JitsiMeetJS.events.conference.TRACK_ADDED;

/**
 * Adds an eventListener to the TRACK_ADDED event
 * so that any newly created track gets added to our converter
 */
function initListener(streams) {
    TrackEvents.TRACK_ADDED.addEventListener(function (name, event) {
        console.log("new track got added: " + event);
        //streams.push(event.GETSTREAMSSOMEHOW); // FIXME
    })
}

/**
 *
 * @constructor constructs an Recorder object which
 */
function Recorder() {
    //new streams get added to the array
    let streams = [];
    initListener(streams);
    console.log("successfully initialised the listener!");
}





