const moment = require("moment");

module.exports = {
    sendInitialDmToUser: function(reaction, user) {
        //Validate reaction is correct emoji
        if (reaction.emoji.name != process.env.welcomeEmoji) return;

        user.send("Create a copy of this Google Document, fill it out, and send the URL back to me. Please ensure that you allow all users with a link to view your document.\n\nYou only get 1 submission every 6 hours. If you mess up, you have to wait.\n\nApplication: https://docs.google.com/document/d/16ZFiYO2aLMMTSP0eFejfj1kXdz3AtgmPqP7MUn38xAQ/edit?usp=sharing");
    },

    handleGoogleDocDM: function(client, message) {
        if (!result) return message.author.send("You have not reacted to the message in <#" + process.env.instructionsChannel + ">. React to the message to make a submission.");

        message.author.send("Your application has been submitted. I will send you a message if you are accepted. Thank you!");

        var username = message.author.id;
        var date = moment().format("lll");

        client.channels.cache.get(process.env.processingVoteChannel).send("Applicant Username: <@" + username + ">\nDate: " + date + "\nDocument Link: " + message.content).then(function(message) {
            message.react(process.env.acceptEmoji);
            message.react(process.env.denyEmoji);
        });
    }
}