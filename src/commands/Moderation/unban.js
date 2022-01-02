const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'unban',
    description: 'Unbans a user from the server',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to be unbanned',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'reason',
            description: 'The reason for the unban',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    async execute({ interaction, guild, channel, targetUser, user }) {
        const reason = interaction.options.getString('reason') || 'Pity on thy account!'
        const bans = await guild.bans.fetch()

        // Check if user is currently banned
        if (!bans.has(targetUser.id))
            return 'This user is not banned in this server!'

        // Create embed
        const unbanConfirmationEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Unban Confirmation')
            .setDescription(`Are you sure you would like to unban the user <@${targetUser.id}>?`)
            .setTimestamp()

        // Create buttons
        const unbanConfirmationButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('unban_confirm')
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('unban_void')
                    .setLabel('No')
                    .setStyle('DANGER')
            )

        await interaction.reply({
            embeds: [unbanConfirmationEmbed],
            components: [unbanConfirmationButtons],
            ephemeral: true
        })

        // On button click
        const filter = i => (i.customId === 'unban_confirm' || i.customId === 'unban_void') && i.user.id === user.id
        const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 });
        collector.on('collect', async i => {
            if (i.customId === 'unban_confirm') {
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
                    punishment: 'Unban',
                    reason: reason,
                    staffId: user.id,
                })

                guild.members.unban(targetUser.id, reason)

                return i.reply({
                    content: `Unanned the user <@${targetUser.id}> for reason *${reason}*`,
                    ephemeral: true
                })

            } else if (i.customId === 'unban_void') {
                // Do not unban user
                return i.reply({
                    content: 'The user was not unbanned',
                    ephemeral: true
                })
            }
        })

    }
}