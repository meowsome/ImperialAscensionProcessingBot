const moment = require("moment");

module.exports = {
    sendInitialDmToUser: function(reaction, user) {
        //Validate reaction is correct emoji
        if (reaction.emoji.name != process.env.welcomeEmoji) return;

        user.send("Create a copy of this Google Document, fill it out, and send the URL back to me. Please ensure that you allow all users with a link to view your document.\n\nYou only get 1 submission every 6 hours. If you mess up, you have to wait.\n\nApplication: https://docs.google.com/document/d/16ZFiYO2aLMMTSP0eFejfj1kXdz3AtgmPqP7MUn38xAQ/edit?usp=sharing");
    },

    handleGoogleDocDM: function(client, message) {
        var userId = message.author.id;

        checkIfVerified(client, userId, function(result) {
            if (!result) return message.author.send("You have not reacted to the message in <#" + process.env.instructionsChannel + ">. React to the message to make a submission.");

            checkIfAlreadySubmitted(client, userId, function(result) {
                if (!result) return message.author.send("You have submitted an application within the past six hours. Please wait before applying again.");

                checkIfAccepted(client, userId, function(result) {
                    if (!result) return message.author.send("You have already been accepted.");

                    message.author.send("Your application has been submitted. I will send you a message if you are accepted. Thank you!");

                    var date = moment().format("lll");

                    client.channels.cache.get(process.env.processingVoteChannel).send("Applicant Username: <@" + userId + ">\nDate: " + date + "\nDocument Link: " + message.content).then(function(message) {
                        message.react(process.env.acceptEmoji);
                        message.react(process.env.denyEmoji);
                    });
                });
            });
        });
    }
}

// Check if the user has reacted to the message in the instructions channel 
function checkIfVerified(client, userId, callback) {
    var channel = client.channels.cache.get(process.env.instructionsChannel);

    channel.messages.fetch().then(function (messages) {
        messages.first().reactions.resolve(process.env.welcomeEmoji).users.fetch().then(function (users) {
            callback(users.find(user => user.id == userId) ? true : false)
        });
    });
}

// Check if the user already has an accepted/denied/pending application over a certain date
function checkIfAlreadySubmitted(client, userId, callback) {
    var processingVoteChannel = client.channels.cache.get(process.env.processingVoteChannel);
    var deniedApplicantsChannel = client.channels.cache.get(process.env.deniedApplicantsChannel);

    processingVoteChannel.messages.fetch().then(function (messages) {
        deniedApplicantsChannel.messages.fetch().then(function (messages2) {
            messages = messages.concat(messages2);

            // Find all messages sent less than 6 hours ago by the user
            var userApplications = messages.filter(message => message.content.includes(userId) && moment().diff(moment(message.createdAt), 'hours') < 6);

            // If no messages, then user is good to submit again
            callback(userApplications.size == 0);
        });
    });
}

// Check if user was already accepted into the program
function checkIfAccepted(client, userId, callback) {
    var channel = client.channels.cache.get(process.env.acceptedApplicantsChannel);

    channel.messages.fetch().then(function(messages) {
        callback (messages.find(message => message.author.id == userId) ? true : false);
    });
}