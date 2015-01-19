!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.API=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Implements API class that communicates with external api class
 * and provides interface to access Jitsi Meet features by external
 * applications that embed Jitsi Meet
 */



/**
 * List of the available commands.
 * @type {{
 *              displayName: inputDisplayNameHandler,
 *              muteAudio: toggleAudio,
 *              muteVideo: toggleVideo,
 *              filmStrip: toggleFilmStrip
 *          }}
 */
var commands =
{
    displayName: UI.inputDisplayNameHandler,
    muteAudio: UI.toggleAudio,
    muteVideo: UI.toggleVideo,
    toggleFilmStrip: UI.toggleFilmStrip,
    toggleChat: UI.toggleChat,
    toggleContactList: UI.toggleContactList
};


/**
 * Maps the supported events and their status
 * (true it the event is enabled and false if it is disabled)
 * @type {{
 *              incomingMessage: boolean,
 *              outgoingMessage: boolean,
 *              displayNameChange: boolean,
 *              participantJoined: boolean,
 *              participantLeft: boolean
 *      }}
 */
var events =
{
    incomingMessage: false,
    outgoingMessage:false,
    displayNameChange: false,
    participantJoined: false,
    participantLeft: false
};

/**
 * Processes commands from external applicaiton.
 * @param message the object with the command
 */
function processCommand(message)
{
    if(message.action != "execute")
    {
        console.error("Unknown action of the message");
        return;
    }
    for(var key in message)
    {
        if(commands[key])
            commands[key].apply(null, message[key]);
    }
}

/**
 * Processes events objects from external applications
 * @param event the event
 */
function processEvent(event) {
    if(!event.action)
    {
        console.error("Event with no action is received.");
        return;
    }

    var i = 0;
    switch(event.action)
    {
        case "add":
            for(; i < event.events.length; i++)
            {
                events[event.events[i]] = true;
            }
            break;
        case "remove":
            for(; i < event.events.length; i++)
            {
                events[event.events[i]] = false;
            }
            break;
        default:
            console.error("Unknown action for event.");
    }

}

/**
 * Sends message to the external application.
 * @param object
 */
function sendMessage(object) {
    window.parent.postMessage(JSON.stringify(object), "*");
}

/**
 * Processes a message event from the external application
 * @param event the message event
 */
function processMessage(event)
{
    var message;
    try {
        message = JSON.parse(event.data);
    } catch (e) {}

    if(!message.type)
        return;
    switch (message.type)
    {
        case "command":
            processCommand(message);
            break;
        case "event":
            processEvent(message);
            break;
        default:
            console.error("Unknown type of the message");
            return;
    }

}

var API = {
    /**
     * Check whether the API should be enabled or not.
     * @returns {boolean}
     */
    isEnabled: function () {
        var hash = location.hash;
        if(hash && hash.indexOf("external") > -1 && window.postMessage)
            return true;
        return false;
    },
    /**
     * Initializes the APIConnector. Setups message event listeners that will
     * receive information from external applications that embed Jitsi Meet.
     * It also sends a message to the external application that APIConnector
     * is initialized.
     */
    init: function () {
        if (window.addEventListener)
        {
            window.addEventListener('message',
                processMessage, false);
        }
        else
        {
            window.attachEvent('onmessage', processMessage);
        }
        sendMessage({type: "system", loaded: true});
    },
    /**
     * Checks whether the event is enabled ot not.
     * @param name the name of the event.
     * @returns {*}
     */
    isEventEnabled: function (name) {
        return events[name];
    },

    /**
     * Sends event object to the external application that has been subscribed
     * for that event.
     * @param name the name event
     * @param object data associated with the event
     */
    triggerEvent: function (name, object) {
        if(this.isEnabled() && this.isEventEnabled(name))
            sendMessage({
                type: "event", action: "result", event: name, result: object});
    },

    /**
     * Removes the listeners.
     */
    dispose: function () {
        if(window.removeEventListener)
        {
            window.removeEventListener("message",
                processMessage, false);
        }
        else
        {
            window.detachEvent('onmessage', processMessage);
        }

    }


};

module.exports = API;
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL0FQSS9BUEkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBJbXBsZW1lbnRzIEFQSSBjbGFzcyB0aGF0IGNvbW11bmljYXRlcyB3aXRoIGV4dGVybmFsIGFwaSBjbGFzc1xuICogYW5kIHByb3ZpZGVzIGludGVyZmFjZSB0byBhY2Nlc3MgSml0c2kgTWVldCBmZWF0dXJlcyBieSBleHRlcm5hbFxuICogYXBwbGljYXRpb25zIHRoYXQgZW1iZWQgSml0c2kgTWVldFxuICovXG5cblxuXG4vKipcbiAqIExpc3Qgb2YgdGhlIGF2YWlsYWJsZSBjb21tYW5kcy5cbiAqIEB0eXBlIHt7XG4gKiAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IGlucHV0RGlzcGxheU5hbWVIYW5kbGVyLFxuICogICAgICAgICAgICAgIG11dGVBdWRpbzogdG9nZ2xlQXVkaW8sXG4gKiAgICAgICAgICAgICAgbXV0ZVZpZGVvOiB0b2dnbGVWaWRlbyxcbiAqICAgICAgICAgICAgICBmaWxtU3RyaXA6IHRvZ2dsZUZpbG1TdHJpcFxuICogICAgICAgICAgfX1cbiAqL1xudmFyIGNvbW1hbmRzID1cbntcbiAgICBkaXNwbGF5TmFtZTogVUkuaW5wdXREaXNwbGF5TmFtZUhhbmRsZXIsXG4gICAgbXV0ZUF1ZGlvOiBVSS50b2dnbGVBdWRpbyxcbiAgICBtdXRlVmlkZW86IFVJLnRvZ2dsZVZpZGVvLFxuICAgIHRvZ2dsZUZpbG1TdHJpcDogVUkudG9nZ2xlRmlsbVN0cmlwLFxuICAgIHRvZ2dsZUNoYXQ6IFVJLnRvZ2dsZUNoYXQsXG4gICAgdG9nZ2xlQ29udGFjdExpc3Q6IFVJLnRvZ2dsZUNvbnRhY3RMaXN0XG59O1xuXG5cbi8qKlxuICogTWFwcyB0aGUgc3VwcG9ydGVkIGV2ZW50cyBhbmQgdGhlaXIgc3RhdHVzXG4gKiAodHJ1ZSBpdCB0aGUgZXZlbnQgaXMgZW5hYmxlZCBhbmQgZmFsc2UgaWYgaXQgaXMgZGlzYWJsZWQpXG4gKiBAdHlwZSB7e1xuICogICAgICAgICAgICAgIGluY29taW5nTWVzc2FnZTogYm9vbGVhbixcbiAqICAgICAgICAgICAgICBvdXRnb2luZ01lc3NhZ2U6IGJvb2xlYW4sXG4gKiAgICAgICAgICAgICAgZGlzcGxheU5hbWVDaGFuZ2U6IGJvb2xlYW4sXG4gKiAgICAgICAgICAgICAgcGFydGljaXBhbnRKb2luZWQ6IGJvb2xlYW4sXG4gKiAgICAgICAgICAgICAgcGFydGljaXBhbnRMZWZ0OiBib29sZWFuXG4gKiAgICAgIH19XG4gKi9cbnZhciBldmVudHMgPVxue1xuICAgIGluY29taW5nTWVzc2FnZTogZmFsc2UsXG4gICAgb3V0Z29pbmdNZXNzYWdlOmZhbHNlLFxuICAgIGRpc3BsYXlOYW1lQ2hhbmdlOiBmYWxzZSxcbiAgICBwYXJ0aWNpcGFudEpvaW5lZDogZmFsc2UsXG4gICAgcGFydGljaXBhbnRMZWZ0OiBmYWxzZVxufTtcblxuLyoqXG4gKiBQcm9jZXNzZXMgY29tbWFuZHMgZnJvbSBleHRlcm5hbCBhcHBsaWNhaXRvbi5cbiAqIEBwYXJhbSBtZXNzYWdlIHRoZSBvYmplY3Qgd2l0aCB0aGUgY29tbWFuZFxuICovXG5mdW5jdGlvbiBwcm9jZXNzQ29tbWFuZChtZXNzYWdlKVxue1xuICAgIGlmKG1lc3NhZ2UuYWN0aW9uICE9IFwiZXhlY3V0ZVwiKVxuICAgIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlVua25vd24gYWN0aW9uIG9mIHRoZSBtZXNzYWdlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvcih2YXIga2V5IGluIG1lc3NhZ2UpXG4gICAge1xuICAgICAgICBpZihjb21tYW5kc1trZXldKVxuICAgICAgICAgICAgY29tbWFuZHNba2V5XS5hcHBseShudWxsLCBtZXNzYWdlW2tleV0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgZXZlbnRzIG9iamVjdHMgZnJvbSBleHRlcm5hbCBhcHBsaWNhdGlvbnNcbiAqIEBwYXJhbSBldmVudCB0aGUgZXZlbnRcbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc0V2ZW50KGV2ZW50KSB7XG4gICAgaWYoIWV2ZW50LmFjdGlvbilcbiAgICB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFdmVudCB3aXRoIG5vIGFjdGlvbiBpcyByZWNlaXZlZC5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaSA9IDA7XG4gICAgc3dpdGNoKGV2ZW50LmFjdGlvbilcbiAgICB7XG4gICAgICAgIGNhc2UgXCJhZGRcIjpcbiAgICAgICAgICAgIGZvcig7IGkgPCBldmVudC5ldmVudHMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW2V2ZW50LmV2ZW50c1tpXV0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJyZW1vdmVcIjpcbiAgICAgICAgICAgIGZvcig7IGkgPCBldmVudC5ldmVudHMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZXZlbnRzW2V2ZW50LmV2ZW50c1tpXV0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVua25vd24gYWN0aW9uIGZvciBldmVudC5cIik7XG4gICAgfVxuXG59XG5cbi8qKlxuICogU2VuZHMgbWVzc2FnZSB0byB0aGUgZXh0ZXJuYWwgYXBwbGljYXRpb24uXG4gKiBAcGFyYW0gb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIHNlbmRNZXNzYWdlKG9iamVjdCkge1xuICAgIHdpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkob2JqZWN0KSwgXCIqXCIpO1xufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIG1lc3NhZ2UgZXZlbnQgZnJvbSB0aGUgZXh0ZXJuYWwgYXBwbGljYXRpb25cbiAqIEBwYXJhbSBldmVudCB0aGUgbWVzc2FnZSBldmVudFxuICovXG5mdW5jdGlvbiBwcm9jZXNzTWVzc2FnZShldmVudClcbntcbiAgICB2YXIgbWVzc2FnZTtcbiAgICB0cnkge1xuICAgICAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgaWYoIW1lc3NhZ2UudHlwZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKVxuICAgIHtcbiAgICAgICAgY2FzZSBcImNvbW1hbmRcIjpcbiAgICAgICAgICAgIHByb2Nlc3NDb21tYW5kKG1lc3NhZ2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJldmVudFwiOlxuICAgICAgICAgICAgcHJvY2Vzc0V2ZW50KG1lc3NhZ2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5rbm93biB0eXBlIG9mIHRoZSBtZXNzYWdlXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgIH1cblxufVxuXG52YXIgQVBJID0ge1xuICAgIC8qKlxuICAgICAqIENoZWNrIHdoZXRoZXIgdGhlIEFQSSBzaG91bGQgYmUgZW5hYmxlZCBvciBub3QuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBoYXNoID0gbG9jYXRpb24uaGFzaDtcbiAgICAgICAgaWYoaGFzaCAmJiBoYXNoLmluZGV4T2YoXCJleHRlcm5hbFwiKSA+IC0xICYmIHdpbmRvdy5wb3N0TWVzc2FnZSlcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgQVBJQ29ubmVjdG9yLiBTZXR1cHMgbWVzc2FnZSBldmVudCBsaXN0ZW5lcnMgdGhhdCB3aWxsXG4gICAgICogcmVjZWl2ZSBpbmZvcm1hdGlvbiBmcm9tIGV4dGVybmFsIGFwcGxpY2F0aW9ucyB0aGF0IGVtYmVkIEppdHNpIE1lZXQuXG4gICAgICogSXQgYWxzbyBzZW5kcyBhIG1lc3NhZ2UgdG8gdGhlIGV4dGVybmFsIGFwcGxpY2F0aW9uIHRoYXQgQVBJQ29ubmVjdG9yXG4gICAgICogaXMgaW5pdGlhbGl6ZWQuXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAod2luZG93LmFkZEV2ZW50TGlzdGVuZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJyxcbiAgICAgICAgICAgICAgICBwcm9jZXNzTWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbm1lc3NhZ2UnLCBwcm9jZXNzTWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgc2VuZE1lc3NhZ2Uoe3R5cGU6IFwic3lzdGVtXCIsIGxvYWRlZDogdHJ1ZX0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGV2ZW50IGlzIGVuYWJsZWQgb3Qgbm90LlxuICAgICAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBpc0V2ZW50RW5hYmxlZDogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50c1tuYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2VuZHMgZXZlbnQgb2JqZWN0IHRvIHRoZSBleHRlcm5hbCBhcHBsaWNhdGlvbiB0aGF0IGhhcyBiZWVuIHN1YnNjcmliZWRcbiAgICAgKiBmb3IgdGhhdCBldmVudC5cbiAgICAgKiBAcGFyYW0gbmFtZSB0aGUgbmFtZSBldmVudFxuICAgICAqIEBwYXJhbSBvYmplY3QgZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGV2ZW50XG4gICAgICovXG4gICAgdHJpZ2dlckV2ZW50OiBmdW5jdGlvbiAobmFtZSwgb2JqZWN0KSB7XG4gICAgICAgIGlmKHRoaXMuaXNFbmFibGVkKCkgJiYgdGhpcy5pc0V2ZW50RW5hYmxlZChuYW1lKSlcbiAgICAgICAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImV2ZW50XCIsIGFjdGlvbjogXCJyZXN1bHRcIiwgZXZlbnQ6IG5hbWUsIHJlc3VsdDogb2JqZWN0fSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBkaXNwb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKVxuICAgICAgICB7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIixcbiAgICAgICAgICAgICAgICBwcm9jZXNzTWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgd2luZG93LmRldGFjaEV2ZW50KCdvbm1lc3NhZ2UnLCBwcm9jZXNzTWVzc2FnZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFQSTsiXX0=
