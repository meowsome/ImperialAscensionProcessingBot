module.exports = {
    resendWelcomeMessage: function(client, member) {
        if (!validatePermissions(member)) return;

        client.channels.cache.get(process.env.instructionsChannel).send("https://docs.google.com/document/d/16ZFiYO2aLMMTSP0eFejfj1kXdz3AtgmPqP7MUn38xAQ/edit?usp=sharing\n\nReact to proceed into the application submission channel.\n\n**Make sure you've read the Application document and follow the format, your application will be ignored if you do not apply properly.**").then(function(message) {
            message.react(process.env.welcomeEmoji);
        });
    },

    handleApplication: function(client, reaction, user) {
        // Fail if invalid perms OR if emoji is not dedicated accept/deny emojis
        if (!validatePermissions(user) || (reaction.emoji.name != process.env.acceptEmoji && reaction.emoji.name != process.env.denyEmoji)) return;

        var success = reaction.emoji.name == process.env.acceptEmoji;
        var channel = success ? process.env.acceptedApplicantsChannel : process.env.deniedApplicantsChannel;
    
        // Send new message, remove "document link" from string
        client.channels.cache.get(channel).send(reaction.message.content.split("Document Link:")[0]);
        
        // Delete message
        reaction.message.delete();
        // client.channels.cache.get(process.env.processingVoteChannel).messages.fetch()

        if (success) sendAcceptanceToApplicant(client, reaction.message);
    }
}

function sendAcceptanceToApplicant(client, message) {
    // Get the user ID from the message
    var userID = message.content.split("\n")[0].split(": ")[1].replace(/\D/g, "");
    var user = client.users.cache.find(u => u.id == userID);
        
    user.send("Congratulations on your acceptance into the Imperial Ascension Program.\n\nJoin the Arconian discord and leave the Applications discord.\n\nhttps://discord.com/invite/wpNyZ44\n\nFirstly, all Ascendants are required to read and understand the Arconian Codex [https://docs.google.com/document/d/1bG_b6xARoCD47a8VXzymfM-VZ4q2Jx6fYyUFf-sEX34/edit].\n\n**MAKE SURE TO PRIMARY THE GROUP WHEN YOU JOIN AS A STAGE 1.**\n\nNext, you should read the Stage 1 Guide.  This contains everything you need to do to advance to Stage 2.\nhttps://docs.google.com/document/d/1G90AdyT4R2WR6ZFdPbcWNJZXJEOsmaY8nl5liDI6iZk/edit\n\nLastly, it is also highly recommended that you look at this:\nhttps://imgur.com/a/QRcviBo - It is the callouts for our primary base: The Armageddon Shipyard");
}

function validatePermissions(member) {
    return (member.hasPermission('ADMINISTRATOR'));
}