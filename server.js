// https://glitch.com/edit/#!/booga-booga-twich-communication
const Discord = require('discord.js');
const express = require("express");
const fs = require('fs');

const app = express();
const client = new Discord.Client();

const BoogaDiscord = "615614976916324352";
const TwitchSubscriberRoleID = "629439055876325408";

const TRUE = "true";
const FALSE = "false";

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

app.get("/", (request, response) => {
    var BoogaCord = client.guilds.cache.get(BoogaDiscord);
    var Username = request.headers['roblox-name'];
    if (BoogaCord !== undefined && Username !== undefined){
        
        var Valid = FALSE; // Not a twitch subscriber...
        BoogaCord.members.forEach(member => {
            var OwnsRole = member.roles.cache.find(TwitchSubscriberRoleID);
            if (BoogaCord.nickname == Username && OwnsRole){
                Valid = TRUE; // Twitch Subscriber!
            }
        });

        response.send(Valid); // Sends response back to Roblox;
    }else{
        response.send(FALSE); // Not in the server or an invalid request.
    }
});

const listener = app.listen(process.env.PORT, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

client.login(fs.readFileSync("token.txt", "utf-8"));