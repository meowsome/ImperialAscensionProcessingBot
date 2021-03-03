module.exports = {
    // Get all messages sent by bot that have reactions on them
    findBotImportantMessage: function(messages, clientId) {
        return messages.filter(message => message.author.id == clientId && message.reactions.cache.size > 0);
    }
}