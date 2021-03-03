const Discord = require("discord.js");
const client = new Discord.Client();
require("dotenv").config();

const adminCommands = require("./commands/adminCommands");
const dmCommands = require("./commands/dmCommands");
const functions = require("./commands/functions");

client.on("ready", function () {
    console.log("Imperial Ascension Bot started");
    cacheOldMessages(client);
});

client.on("message", async function(message) {
    if (message.author.bot) return;
    if (message.channel.type == "dm") {
        // If receive DM with google docs link...
        if (message.content.includes("docs.google.com")) dmCommands.handleGoogleDocDM(client, message);

        return;
    }

    var input = message.content;
    var args = input.split("");

    if (args[0] == process.env.prefixSymbol) {
        args.shift();
        args = args.join("").split(" ");
        var command = args[0];

        switch (command) {
            case "resendWelcomeMessage":
                adminCommands.resendWelcomeMessage(client, message.member, message);
                break;
        }
    }
});

// Listen for reactions
client.on("messageReactionAdd", async function (reaction, user) {
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			return console.error("Welcome message reaction listener failed to fetch message: ", error);
		}
	}

    // If is self, cancel
    if (user.bot) return;

    var channel = reaction.message.channel.id;
    
    switch (channel) {
        case process.env.instructionsChannel:
            dmCommands.sendInitialDmToUser(reaction, user);
            break;
        case process.env.processingVoteChannel:
            // Cannot just use 'user', must use 'member' because it is of type 'GuildMember'
            var member = reaction.message.guild.members.cache.find(member => member.id == user.id);
            adminCommands.handleApplication(client, reaction, member);
            break;
    }
});

process.on("uncaughtException", function (err) {
	console.error("Uncaught Exception: ", err);
});

process.on("unhandledRejection", function (err) {
	console.error("Uncaught Promise Error: ", err);
});

client.login(process.env.token);

function cacheOldMessages() {
    var instructionsChannel = client.channels.cache.get(process.env.instructionsChannel);
    var processingVoteChannel = client.channels.cache.get(process.env.processingVoteChannel);

    if (instructionsChannel && processingVoteChannel) {
        instructionsChannel.messages.fetch().then(async function (messages) {
            processingVoteChannel.messages.fetch().then(async function (newMessages) {
                // Get all messages sent by bot that have reactions on them
                messages = functions.findBotImportantMessage(messages.concat(newMessages), client.user.id);

                console.log(messages.size + " messages cached");
            });
        });
    } else {
        console.log("An error occurred caching old messages.");
    }
}