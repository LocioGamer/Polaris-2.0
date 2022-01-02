const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'softban',
    description: 'Soft-bans a user from the server',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to be soft-banned',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'reason',
            description: 'The reason for the soft-ban',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        },
        {
            name: 'days',
            description: 'Amount of days that users messages are deleted',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
            min_value: 0,
            max_value: 7
        }
    ],
    async execute({ interaction, guild, channel, targetUser, targetMember, user }) {
        const days = interaction.options.getInteger('days') || 0
        const reason = interaction.options.getString('reason') || 'The ban hammer has spoken (quietly)!'

        // Check if user can be banned
        if (!targetMember)
            return `The user <@${targetUser.id}> is not in this guild`

        if (!targetMember.bannable)
            return `The user <@${targetUser.id}> is not soft-bannable`
            

        // Create embed
        const softBanConfirmationEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Ban Confirmation')
            .setDescription(`Are you sure you would like to soft-ban the user <@${targetUser.id}> and remove their messages from the past ${days} days?`)
            .setTimestamp()

        // Create buttons
        const softBanConfirmationButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('soft_ban_confirm')
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('soft_ban_void')
                    .setLabel('No')
                    .setStyle('DANGER')
            )

        await interaction.reply({
            embeds: [softBanConfirmationEmbed],
            components: [softBanConfirmationButtons],
            ephemeral: true
        })

        // On button click
        const filter = i => (i.customId === 'soft_ban_confirm' || i.customId === 'soft_ban_void') && i.user.id === user.id
        const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 });
        collector.on('collect', async i => {
            if (i.customId === 'soft_ban_confirm') {
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
                    punishment: 'Soft-Ban',
                    reason: reason,
                    staffId: user.id,
                })

                targetMember.ban({ reason, days })
                guild.members.unban(targetUser.id, reason)

                return i.reply({
                    content: `Soft-banned the user <@${targetUser.id}> for reason *${reason}*\nDeleted messages sent by the user for the past ${days} days`,
                    ephemeral: true
                })

            } else if (i.customId === 'soft_ban_void') {
                // Do not soft-ban user
                return i.reply({
                    content: 'The user was not soft-banned',
                    ephemeral: true
                })
            }
        })

    }
}