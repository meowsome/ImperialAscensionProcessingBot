const moment = require("moment");
const functions = require('./functions');

module.exports = {
    resendWelcomeMessage: function(client, member, message) {
        if (!validatePermissionsAdmin(member)) return message.channel.send("Insufficient permissions. You must be an admin to perform this command.");

        client.channels.cache.get(process.env.instructionsChannel).send("React to proceed into the application submission channel.\n\n**Make sure you've read the Application document and follow the format, your application will be ignored if you do not apply properly.**").then(function(message) {
            message.react(functions.getServerEmoji(message.guild.emojis, process.env.welcomeEmoji));
        });
    },

    handleApplication: function(client, reaction, user) {
        // Fail if invalid perms (neither admin or processor role)
        if (!validatePermissionsProcessors(user) && !validatePermissionsAdmin(user)) return reaction.users.remove(user);

        // Fail if emoji is not dedicated confirm emojis
        if (reaction.emoji.name != process.env.confirmEmoji) return;
        
        var reactions = reaction.message.reactions;

        // Calculate all acceptances and denials from the current application, subtract 2 to remove the bot's votes
        var totalVotes = reactions.resolve(process.env.acceptEmoji).count + reactions.resolve(process.env.denyEmoji).count - 2;

        // Only allow confirm reaction to work if 5 total votes. 
        if (totalVotes < 5) return reaction.users.remove(user);

        // Determine which channel to send to
        var success = reactions.resolve(process.env.acceptEmoji).count >= reactions.resolve(process.env.denyEmoji).count;
        var channel = success ? process.env.acceptedApplicantsChannel : process.env.deniedApplicantsChannel;
        var actionMessage = success ? "\nAccepted by: " : "\nDenied by: ";
    
        // Send new message
        var date = moment().format("lll");
        // Remove the mention of the application processor role and replace the time with the current time
        var messageParts = reaction.message.content.replace("\n<@&" + process.env.applicationprocessorsRole + ">", "").replace(/Date:.*?\n/, "Date: " + date + "\n", "") + actionMessage + "<@" + user.id + ">";
        client.channels.cache.get(channel).send(messageParts);
        
        // Delete message
        reaction.message.delete();

        sendMessageToApplicant(client, reaction.message, success);
    }
}

function sendMessageToApplicant(client, message, success) {
    // Get the user ID from the message
    var userID = message.content.split("\n")[0].split(": ")[1].replace(/\D/g, "");
    var user = client.users.cache.find(u => u.id == userID);

    // Create text for success or deny
    var text = success ? "Congratulations on your acceptance into the Imperial Ascension Program.\n\nJoin the Arconian Discord and leave the Applications Discord.\n\nhttps://discord.com/invite/wpNyZ44\n\nFirstly, all Ascendants are required to read and understand the Arconian Codex [https://docs.google.com/document/d/1bG_b6xARoCD47a8VXzymfM-VZ4q2Jx6fYyUFf-sEX34/edit].\n\nMAKE SURE TO PRIMARY THE GROUP WHEN YOU JOIN AS A STAGE 1.\n\nNext, you should read the Stage 1 Guide. This contains everything you need to do to advance to Stage 2.\nhttps://docs.google.com/document/d/1G90AdyT4R2WR6ZFdPbcWNJZXJEOsmaY8nl5liDI6iZk/edit\n\nLastly, it is also highly recommended that you look at this:\nhttps://imgur.com/a/QRcviBo - It is the callouts for our primary base: The Armageddon Shipyard" : "You have been denied. You may re apply in " + process.env.cooldownHours + " hours.";
        
    user.send(text);
}

function validatePermissionsAdmin(member) {
    return member.hasPermission('ADMINISTRATOR');
}

function validatePermissionsProcessors(member) {
    return member.roles.cache.some(role => role.name == "Application Processors");
}