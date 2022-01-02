const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'kick',
    description: 'Kicks a user from the server',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to be kicked',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'reason',
            description: 'The reason for the ban',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    async execute({ interaction, guild, channel, targetUser, targetMember, user }) {
        const reason = interaction.options.getString('reason') || 'Yeet!'

        // Check if user can be kicked
        if (!targetMember)
            return `The user <@${targetUser.id}> is not in this guild`

        if (!targetMember.kickable)
            return `The user <@${targetUser.id}> is not kickable`

            
        // Create embed
        const kickConfirmationEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Kick Confirmation')
            .setDescription(`Are you sure you would like to kick the user <@${targetUser.id}>?`)
            .setTimestamp()

        // Create buttons
        const kickConfirmationButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('kick_confirm')
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('kick_void')
                    .setLabel('No')
                    .setStyle('DANGER')
            )

        await interaction.reply({
            embeds: [kickConfirmationEmbed],
            components: [kickConfirmationButtons],
            ephemeral: true
        })

        // On button click
        const filter = i => (i.customId === 'kick_confirm' || i.customId === 'kick_void') && i.user.id === user.id
        const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 });
        collector.on('collect', async i => {
            if (i.customId === 'kick_confirm') {
                // Get last punishment id
                const punishment = await punishmentLogSchema.findOne({
                    guildId: guild.id,
                    userId: targetUser.id
                }, {}, { sort: { createdAt: -1 } })

                // Create a log of the ban
                await punishmentLogSchema.create({
                    punishmentId: punishment ? punishment.punishmentId + 1 : 1,
                    guildId: guild.id,
                    userId: targetUser.id,
                    punishment: 'Kick',
                    reason: reason,
                    staffId: user.id,
                })

                targetMember.kick(reason)

                return i.reply({
                    content: `Kicked the user <@${targetUser.id}> for reason *${reason}*`,
                    ephemeral: true
                })

            } else if (i.customId === 'kick_void') {
                // Do not kick user
                return i.reply({
                    content: 'The user was not kicked',
                    ephemeral: true
                })
            }
        })

    }
}