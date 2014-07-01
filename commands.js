/**
 * Handles commands received via chat messages.
 */
var CommandsProcessor = (function()
{
    /**
     * Constructs new CommandProccessor instance from a message.
     * @param message the message
     * @constructor
     */
    function CommandsPrototype(message)
    {
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

        var command = getCommand(message);

        /**
         * Returns the name of the command.
         * @returns {String} the command
         */
        this.getCommand = function()
        {
            return command;
        }


        var messageArgument = message.substr(command.length + 2);

        /**
         * Returns the arguments of the command.
         * @returns {string}
         */
        this.getArgument = function()
        {
            return messageArgument;
        }
    }

    /**
     * Checks whether this instance is valid command or not.
     * @returns {boolean}
     */
    CommandsPrototype.prototype.isCommand = function()
    {
        if(this.getCommand())
            return true;
        return false;
    }

    /**
     * Processes the command.
     */
    CommandsPrototype.prototype.processCommand = function()
    {
        if(!this.isCommand())
            return;

        commands[this.getCommand()](this.getArgument());

    }

    /**
     * Processes the data for topic command.
     * @param commandArguments the arguments of the topic command.
     */
    var processTopic = function(commandArguments)
    {
        var topic = Util.escapeHtml(commandArguments);
        connection.emuc.setSubject(topic);
    }

    /**
     * List with supported commands. The keys are the names of the commands and
     * the value is the function that processes the message.
     * @type {{String: function}}
     */
    var commands = {
        "topic" : processTopic
    };

    return CommandsPrototype;
})();
