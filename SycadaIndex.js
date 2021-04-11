const Discord = require('discord.js');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const client = new Discord.Client(); //main client
const { Readable } = require('stream'); //streams
const { OpusEncoder } = require('@discordjs/opus');
const { IamAuthenticator } = require('ibm-watson/auth');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
let speech_to_text = new SpeechToTextV1({
    authenticator: new IamAuthenticator({
        apikey: 'REMOVED, PRIVATE INFO',
    }),
    serviceUrl: 'REMOVED, PRIVATE INFO'
});

async function doSpeech(msg) {
    let connection = await msg.member.voice.channel.join()
    if (connection) msg.channel.send("successfully started speech to text/already in VC")
    let stream;

    connection.on('speaking', (user, speaking) => {
        if (speaking.bitfield == 0 || user.bot)
            return

        let audio = connection.receiver.createStream(user, { mode: 'pcm', end: 'silence' });

        if (speaking) {
            console.log(`Speaking: ${user.tag}`);
            let talking = user.username
            stream = ffmpeg(audio).fromFormat('s32le').toFormat('wav').pipe();

            stream.pipe(speech_to_text.recognizeUsingWebSocket({ objectMode: true }).on('error', e => console.log(e)).on('data', (d) => {
                let result = d.results.map(result => result.alternatives.map(alternative => alternative.transcript).join(' ')).join(' ');
                if (result.length > 1 && result !== '%HESIATION')
                    msg.channel.send(`${talking}: ${result.replace(/%HESITATION/g, '')}`);
                
            }));
        }
    });
}

client.on('ready', () => console.log('Ready'))

client.on('message', async msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith('!')) return;
    let command = msg.content.slice(1).trim();
    switch (command) {
        case 'leave':
            if (msg.guild.voice.channel != null || msg.guild.voice.channel != undefined) {
                msg.guild.voice.channel.leave();
                msg.channel.send("I have successfully left the voice channel!");
            } else msg.channel.send("I'm not connected to a voice channel!");
            break;
        case 'speech':
            if (!msg.member.voice.channel) {
                msg.channel.send("You are not in a VC please join one and use !speech again")
                return;
            }
            doSpeech(msg);
            break;
        case 'tts':
            // connection
            break;
        case 'help':
            msg.channel.send("Nothing fancy because I'm lazy right now, we currently have !speech to enable speech to text and !leave to get the bot to leave the voice channel")
            break;
    }
});
client.login('REMOVED, PRIVATE INFO');
