const moment = require("moment");
const functions = require("./functions");

module.exports = {
    sendInitialDmToUser: function(reaction, user) {
        //Validate reaction is correct emoji
        if (reaction.emoji.name != process.env.welcomeEmoji) return;

        user.send("1. Open the google document link below.\n2. Click on \"Make a copy\".\n3. Once you’ve done that fill out the application.\n4. Once you have completed your application, change the document's sharing settings on the top right to \"anyone with the link can view\", and send it back here.\n\nYou are only allowed to apply once every " + process.env.cooldownHours + " hours, so if you mess up that format your application will be ignored.\n\nhttps://docs.google.com/document/d/16ZFiYO2aLMMTSP0eFejfj1kXdz3AtgmPqP7MUn38xAQ/copy");
    },

    handleGoogleDocDM: function(client, message) {
        var userId = message.author.id;

        checkIfVerified(client, userId, function(result) {
            if (!result) return message.author.send("You have not reacted to the message in <#" + process.env.instructionsChannel + ">. React to the message to make a submission.");

            checkIfAlreadySubmitted(client, userId, function(result) {
                if (!result) return message.author.send("You have submitted an application within the past " + process.env.cooldownHours + " hours. Please wait before applying again.");

                checkIfAccepted(client, userId, function(result) {
                    if (result) return message.author.send("You have already been accepted.");

                    message.author.send("Your application has been submitted. I will send you a message if you are accepted. Thank you!");

                    var date = moment().format("lll");

                    client.channels.cache.get(process.env.processingVoteChannel).send("Applicant Username: <@" + userId + ">\nDate: " + date + "\nDocument Link: " + message.content + "\n<@&" + process.env.applicationprocessorsRole + ">").then(function(message) {
                        message.react(process.env.acceptEmoji);
                        message.react(process.env.denyEmoji);
                        message.react(process.env.confirmEmoji);
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
        var message = functions.findBotImportantMessage(messages, client.user.id).first();
        var emoji = functions.getServerEmoji(message.guild.emojis, process.env.welcomeEmoji).id;

        // Check if user has accepted terms by reacting to welcome message
        message.reactions.resolve(emoji).users.fetch().then(function (users) {
            callback(users.some(user => user.id == userId));
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

            // Find all messages sent less than the # of cooldown hours ago by the user
            var userApplications = messages.filter(message => message.content.includes(userId) && moment().diff(moment(message.createdAt), 'hours') < process.env.cooldownHours);

            // If no messages, then user is good to submit again
            callback(userApplications.size == 0);
        });
    });
}

// Check if user was already accepted into the program
function checkIfAccepted(client, userId, callback) {
    var channel = client.channels.cache.get(process.env.acceptedApplicantsChannel);

    channel.messages.fetch().then(function(messages) {
        callback (messages.some(message => message.content.includes(userId)));
    });
}