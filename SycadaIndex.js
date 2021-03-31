const Discord = require("discord.js"),
client = new Discord.Client();
const cfg = require("./config.json");
const fs = require('fs');
const vosk = require('vosk')
const model = new vosk.Model("./vosk-model-en-us-aspire-0.2");
client.commands = new Discord.Collection();

let commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));
commandFiles.forEach(File => {
    let command = require(`./Commands/${File}`);
    command.Path = (`${process.cwd()}/Commands/${File}`);
    client.commands.set(command.name, command);
    if (command.aliases) {
        command.aliases.forEach(Name => {
            client.commands.set(Name, command);
        })
    }
});
client.on('ready', () => {
    console.log(
        `Bot has started, in ${client.guilds.cache.size} servers.`
    );
    client.user.setPresence({
        status: 'online',
        activity: {
            name: 'Your servers.',
            type: 'WATCHING'
        }
    });
});

client.on('message', msg => {
    if (msg.content.includes(`<@!${client.user.id}>`)) {
        msg.reply(
            `My prefix is ${cfg.Prefix} to find out more do ${cfg.Prefix}help`
        );
    }
    if (!msg.content.startsWith(cfg.Prefix) || msg.author.bot) return;
    let args = msg.content.slice(cfg.Prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();
    let LVL = cfg.Admin.some(Elm => msg.member.roles.cache.has(Elm)) || msg.member.hasPermission('MANAGE_CHANNELS') ? 1 : 0;
    LVL = cfg.Dev.includes(msg.author.id) ? 2 : LVL;
    if (client.commands.has(command)) {
        let Permit;
        switch (client.commands.get(command).Level) {
            case 'Dev':
                Permit = 2;
                break;
            case 'Admin': 
                Permit = 1;
                break;
            case 'User':
                Permit = 0;
                break;
            default:
                Permit = 0;
                break;
        }
        if (LVL >= Permit) {
            try {
                client.commands.get(command).execute(msg, args, client, Discord, cfg.Prefix);
            } catch (error) {
                console.log(error);
                msg.reply('There was an error trying to execute that command!');
            }
        } else msg.reply('You do not have The Perms To use this command');
    }
});

client.login(process.env.TOKEN);