const functions = require('./functions');

module.exports = {
    resendWelcomeMessage: function(client, member, message) {
        if (!validatePermissionsAdmin(member)) return message.channel.send("Insufficient permissions. You must be an admin to perform this command.");

        client.channels.cache.get(process.env.instructionsChannel).send("https://docs.google.com/document/d/16ZFiYO2aLMMTSP0eFejfj1kXdz3AtgmPqP7MUn38xAQ/edit?usp=sharing\n\nReact to proceed into the application submission channel.\n\n**Make sure you've read the Application document and follow the format, your application will be ignored if you do not apply properly.**").then(function(message) {
            message.react(functions.getServerEmoji(message.guild.emojis, process.env.welcomeEmoji));
        });
    },

    handleApplication: function(client, reaction, user) {
        // Fail if invalid perms (neither admin or processor role)
        if ((!validatePermissionsProcessors(user) && !validatePermissionsAdmin(user))) return message.channel.send("Insufficient permissions. You must either have the Application Processors role or be an admin to perform this command.");

        // Fail if emoji is not dedicated accept/deny emojis
        if (reaction.emoji.name != process.env.acceptEmoji && reaction.emoji.name != process.env.denyEmoji) return;

        // Determine which channel to send to
        var success = reaction.emoji.name == process.env.acceptEmoji;
        var channel = success ? process.env.acceptedApplicantsChannel : process.env.deniedApplicantsChannel;
    
        // Send new message, remove "document link" from string
        client.channels.cache.get(channel).send(reaction.message.content.split("Document Link:")[0]);
        
        // Delete message
        reaction.message.delete();

        if (success) sendAcceptanceToApplicant(client, reaction.message);
    }
}

function sendAcceptanceToApplicant(client, message) {
    // Get the user ID from the message
    var userID = message.content.split("\n")[0].split(": ")[1].replace(/\D/g, "");
    var user = client.users.cache.find(u => u.id == userID);
        
    user.send("Congratulations on your acceptance into the Imperial Ascension Program.\n\nJoin the Arconian discord and leave the Applications discord.\n\nhttps://discord.com/invite/wpNyZ44\n\nFirstly, all Ascendants are required to read and understand the Arconian Codex [https://docs.google.com/document/d/1bG_b6xARoCD47a8VXzymfM-VZ4q2Jx6fYyUFf-sEX34/edit].\n\n**MAKE SURE TO PRIMARY THE GROUP WHEN YOU JOIN AS A STAGE 1.**\n\nNext, you should read the Stage 1 Guide.  This contains everything you need to do to advance to Stage 2.\nhttps://docs.google.com/document/d/1G90AdyT4R2WR6ZFdPbcWNJZXJEOsmaY8nl5liDI6iZk/edit\n\nLastly, it is also highly recommended that you look at this:\nhttps://imgur.com/a/QRcviBo - It is the callouts for our primary base: The Armageddon Shipyard");
}

function validatePermissionsAdmin(member) {
    return member.hasPermission('ADMINISTRATOR');
}

function validatePermissionsProcessors(member) {
    return member.roles.cache.some(role => role.name == "Application Processors");
}