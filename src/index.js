// Import discord
const { Intents, Collection } = Discord = require('discord.js')

// Import modules
const { readdirSync } = require('fs')
const mongoose = require('mongoose')
require('dotenv').config()
require('module-alias/register')
const { DisTube } = require('distube')
const { SpotifyPlugin } = require('@distube/spotify')

// Register discord
const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
})

// Create command collection
client.commands = new Collection()

// Register music library
client.distube = new DisTube(client, {
    plugins: [new SpotifyPlugin()]
})

// Import functions
const functions = readdirSync(`${__dirname}/functions`).filter(file => file.endsWith('.js'))
const eventFiles = readdirSync(`${__dirname}/events`).filter(file => file.endsWith('.js'))
const commandFolders = readdirSync(`${__dirname}/commands`)

// Login to the bot
client.on('ready', () => {
    console.log('Polaris 2.0 is now online...')

    // Require all function files
    for (file of functions) {
        require(`@functions/${file}`)(client)
    }

    client.handleEvents(eventFiles, `@events`)
    client.handleCommands(commandFolders, `${__dirname}/commands`)

    // Handle features
    require(`@features/checkPunishments`)(client)
    require(`@features/music`)(client)
})

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_SRV, {
    useNewURLParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Database connection established...')
}).catch((error) => {
    console.error(error)
})

// Login to the bot
client.login(process.env.TOKEN)