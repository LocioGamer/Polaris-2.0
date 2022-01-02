const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'unmute',
    description: 'Unmutes a user on the server',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to be unmuted',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'reason',
            description: 'The reason for the unmute',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    async execute({ interaction, guild, channel, targetUser, targetMember, user }) {
        const duration = interaction.options.getString('duration')
        const reason = interaction.options.getString('reason') || 'You may speak once more!'
        const muteRole = guild.roles.cache.find((role) => role.name === 'Muted')

        // Check if user is guild member
        if (!targetMember)
            return `The user <@${targetUser.id}> is not in this guild`

        // Check if the mute role exists
        if (!muteRole)
            return `This server does not have a 'Muted' role`

        // Check if user is not muted
        if (!targetMember.roles.cache.find(muteRole))
            return `This user is not muted on this server`

        
        // Create embed
        const unmuteConfirmationEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Mute Confirmation')
            .setDescription(`Are you sure you would like to unmute the user <@${targetUser.id}>?`)
            .setTimestamp()

        // Create buttons
        const unmuteConfirmationButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('unmute_confirm')
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('unmute_void')
                    .setLabel('No')
                    .setStyle('DANGER')
            )

        await interaction.reply({
            embeds: [unmuteConfirmationEmbed],
            components: [unmuteConfirmationButtons],
            ephemeral: true
        })

        // On button click
        const filter = i => (i.customId === 'unmute_confirm' || i.customId === 'unmute_void') && i.user.id === user.id
        const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 })
        collector.on('collect', async i => {
            if (i.customId === 'unmute_confirm') {

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
                    punishment: 'Unmute',
                    reason: reason,
                    staffId: user.id,
                })

                // Give user muted role
                targetMember.roles.remove(muteRole)

                return i.reply({
                    content: `Unmuted the user <@${targetUser.id}> for reason *${reason}*`,
                    ephemeral: true
                })

            } else if (i.customId === 'unmute_void') {
                // Do not mute user
                return i.reply({
                    content: 'The user was not unmuted',
                    ephemeral: true
                })
            }
        })
    }
}