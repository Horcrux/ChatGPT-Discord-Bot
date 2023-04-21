// Load required modules
// const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')
// const { Configuration, OpenAIApi } = require("openai");

import { Client, Collection, Events, GatewayIntentBits } from "discord.js"
import { Configuration, OpenAIApi } from "openai"
import secrets from "./secrets.json" assert { type: "json" };

const bot_name = "machine"
const token = secrets.discord_token; //discord
const configuration = new Configuration({
	apiKey: secrets.openai_key, //openai
});
let temperature = 0.7;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });
const openai = new OpenAIApi(configuration);

var history, mainChannel, testChannel, ai, txt
var historyLen = 2000

client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

function splitTextIntoChunks(text, maxLength = 2000) {
	console.log(text)
	const words = text.split(' ');
	const chunks = [];
	let currentChunk = '';

	for (const word of words) {
		if (currentChunk.length + word.length + 1 > maxLength) {
			chunks.push(currentChunk);
			currentChunk = '';
		}
		if (currentChunk.length > 0) {
			currentChunk += ' ';
		}
		currentChunk += word;
	}
	if (currentChunk.length > 0) {
		chunks.push(currentChunk);
	}
	return chunks;
}

var messages = [{ 'role': "user", 'content': "hello" }]

var ai
client.on('messageCreate', async (message) => {
	if (message.author.id.includes('some super special string here guys') && !message.content.toLowerCase().includes('npc, ')) {
		return false
	}
	txt = message.content.replace(/[\\$'"]/g, "\\$&")

	if (message.content.toLowerCase().includes(`${bot_name}:`) ||
		message.content.toLowerCase().includes(`${bot_name},`) ||
		message.content.toLowerCase().includes(`${bot_name}?`) ||
		message.content.toLowerCase().includes(`${bot_name}.`) ||
		message.content.toLowerCase().includes(`hey ${bot_name}`) ||
		message.content.toLowerCase().includes(`${bot_name} `) ||
		message.content.toLowerCase().includes(`${bot_name}!`)) {
		message.channel.sendTyping()
		if (message.author.tag.includes('real npc#5859')) { return false; } //bots name

		if (message.content.toLowerCase().includes("gimme the temp")) {
			message.reply(`SYSTEM MESSAGE: my temp is ${temperature}`)
			return false
		}

		if (message.content.toLowerCase().includes("set the temp to")) {
			temperature = parseFloat(message.content.toLowerCase().match(/\d\.?\d*/g)[0])
			message.reply(`SYSTEM MESSAGE: my temp is now ${temperature}`)
			return false
		}

		if (message.content.toLowerCase().includes('forget everything')) {
			messages = [{ 'role': "user", 'content': "hi" }]
			message.reply('i kinda feel funy ;o')
			return false
		}

		if (message.author.id.includes('436084153503711232')) {
			console.log('self')
			return false
		}
		// txt = txt.replace(bot_name, "");


		messages.push({ 'role': 'user', 'content': txt })

		try {
			ai = await openai.createChatCompletion({
				'model': "gpt-3.5-turbo",
				'messages': messages,
				'temperature': temperature,
				'n': 1,
				'max_tokens': 1500,
				'user': message.author.id
			});
			console.log(ai)

			if (ai.data.usage.total_tokens > 2500) {
				message.reply("SYSTEM MESSAGE: we're running out of tokens, so im forgetting some stuff")
				messages.shift();
			}


		} catch (error) {
			message.reply('error')
			console.log(error)
			console.log(error.response.status);
			console.log(error.response.data);
			console.log(error.message);
			return false;
		}

		if (ai.data.choices[0].message) {
			let response = ai.data.choices[0].message
			console.log("response ", response.content)
			var chunks = splitTextIntoChunks(response.content, 2000);
			let i = 0
			while (i < chunks.length) {
				const chunk = chunks[i];
				try {
					message.reply(chunk)
				} catch (error) {
					message.reply('i tried to say something but discord wouldnt let me ;[')
					console.log(error)
				}
				i++;
			}
			//console.log(ai)
			//console.log(ai.data.choices[0].message)


		}
	}
	messages.push({ 'role': 'user', 'content': txt })

	console.log(`[${message.guild.name}][#${message.channel.name}][${message.author.tag}] ${message.content}`);
})

client.login(token);
