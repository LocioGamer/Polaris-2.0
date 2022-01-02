const fs = require('fs')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        // Define guild
        const guild = client.guilds.cache.get('924862620631187487')
        commandArray = []

        for (folder of commandFolders) {
            // Get all command files
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(`${path}/${folder}/${file}`);

                let commands
                if (command.isGlobal) {
                    // Global command
                    commands = client.application.commands
                }
                else {
                    // Add command to the test guild only
                    commands = guild.commands
                }

                // Create command
                commands.create({
                    name: command.name,
                    description: command.description,
                    options: command.options,
                    category: folder,
                    guildOnly: command.guildOnly || false
                })

                // Add command to array
                commandArray.push(command)
                client.commands.set(command.name, command)
            }
        }

        // Place your client and guild ids here
        const clientId = '924862708489281576'
        const guildId = '924862620631187487'

        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

        (async () => {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commandArray },
                )

                console.log(`Loaded ${commandArray.length} commands...`)
            } catch (error) {
                console.error(error)
            }
        })()
    }
}