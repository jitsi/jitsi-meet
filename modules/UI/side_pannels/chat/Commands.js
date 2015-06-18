var UIUtil = require("../../util/UIUtil");

/**
 * List with supported commands. The keys are the names of the commands and
 * the value is the function that processes the message.
 * @type {{String: function}}
 */
var commands = {
    "topic" : processTopic
};

/**
 * Extracts the command from the message.
 * @param message the received message
 * @returns {string} the command
 */
function getCommand(message)
{
    if(message)
    {
        for(var command in commands)
        {
            if(message.indexOf("/" + command) == 0)
                return command;
        }
    }
    return "";
};

/**
 * Processes the data for topic command.
 * @param commandArguments the arguments of the topic command.
 */
function processTopic(commandArguments)
{
    var topic = UIUtil.escapeHtml(commandArguments);
    APP.xmpp.setSubject(topic);
}

/**
 * Constructs new CommandProccessor instance from a message that
 * handles commands received via chat messages.
 * @param message the message
 * @constructor
 */
function CommandsProcessor(message)
{


    var command = getCommand(message);

    /**
     * Returns the name of the command.
     * @returns {String} the command
     */
    this.getCommand = function()
    {
        return command;
    };


    var messageArgument = message.substr(command.length + 2);

    /**
     * Returns the arguments of the command.
     * @returns {string}
     */
    this.getArgument = function()
    {
        return messageArgument;
    };
}

/**
 * Checks whether this instance is valid command or not.
 * @returns {boolean}
 */
CommandsProcessor.prototype.isCommand = function()
{
    if(this.getCommand())
        return true;
    return false;
};

/**
 * Processes the command.
 */
CommandsProcessor.prototype.processCommand = function()
{
    if(!this.isCommand())
        return;

    commands[this.getCommand()](this.getArgument());

};

module.exports = CommandsProcessor;