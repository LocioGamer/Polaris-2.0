module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Command interactions
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName)
            if (!command) return

            // Return if guildOnly command is run outside a guild
            if (command.guildOnly && !interaction.guild)
                return interaction.reply('This command can only be run in a guild')

            // Catch any errors
            try {
                // Execute command and reply
                const reply = await command.execute({
                    client,
                    interaction,
                    guild: interaction.guild,
                    channel: interaction.channel,
                    subCommand: interaction.options.getSubcommand(false),
                    targetUser: interaction.options.getUser('user'),
                    targetMember: interaction.options.getMember('user'),
                    user: interaction.user,
                    member: interaction.member
                })
                if (reply)
                    interaction.reply({ content: reply, ephemeral: true })
            } catch (error) {
                console.error(error)
                await interaction.reply({
                    content: 'An error occured while processing this request. Please try again later.',
                    ephemeral: true
                })
            }
        }
    }
}
