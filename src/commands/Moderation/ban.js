const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'ban',
    description: 'Bans a user from the server',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to be banned',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'duration',
            description: 'Amount of time for the user to be banned (Indefinite by default)',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
        },
        {
            name: 'reason',
            description: 'The reason for the ban',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        },
        {
            name: 'message-erase',
            description: 'Amount of past days that the users messages are deleted',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
            min_value: 0,
            max_value: 7
        }
    ],
    async execute({ interaction, guild, channel, targetUser, targetMember, user }) {
        const duration = interaction.options.getString('duration')
        const reason = interaction.options.getString('reason') || 'The ban hammer has spoken!'
        const days = interaction.options.getInteger('message-erase') || 0

        // Check if user is guild member
        if (!targetMember)
            return `The user <@${targetUser.id}> is not in this guild`

        // Check if user is bannable
        if (!targetMember.bannable)
            return `The user <@${targetUser.id}> is not bannable`
            

        // Get the time and type if provided
        let expires
        if (duration) {
            let time
            let type
            try {
                const split = duration.match(/\d+|\D+/g)
                time = parseInt(split[0])
                type = split[1].toLowerCase()
            } catch (err) {
                return interaction.reply({
                    content: `Invalid duration format (Examples: 2w, 4d, 14h, 60m)`,
                    ephemeral: true
                })
            }
            if (type === 'w') {
                time *= 60 * 24 * 7
            } else if (type === 'd') {
                time *= 60 * 24
            } else if (type === 'h') {
                time *= 60
            } else if (type !== 'm') {
                return interaction.reply({
                    content: `Invalid duration format (Examples: 2w, 4d, 14h, 60m)`,
                    ephemeral: true
                })
            }
            expires = new Date()
            expires.setMinutes(expires.getMinutes() + time)
        }

        // Create embed
        const banConfirmationEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Ban Confirmation')
            .setDescription(`Are you sure you would like to ban the user <@${targetUser.id}>${expires ? ` until ${expires.toUTCString()}` : ''}?`)
            .setTimestamp()

        // Create buttons
        const banConfirmationButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('ban_confirm')
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('ban_void')
                    .setLabel('No')
                    .setStyle('DANGER')
            )

        await interaction.reply({
            embeds: [banConfirmationEmbed],
            components: [banConfirmationButtons],
            ephemeral: true
        })

        // On button click
        const filter = i => (i.customId === 'ban_confirm' || i.customId === 'ban_void') && i.user.id === user.id
        const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 });
        collector.on('collect', async i => {
            if (i.customId === 'ban_confirm') {
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
                    punishment: 'Ban',
                    reason: reason,
                    staffId: user.id,
                    expirationDate: expires
                })

                // Ban the user
                targetMember.ban({ reason, days })

                return i.reply({
                    content: `Banned the user <@${targetUser.id}> for reason *${reason}*${expires ? ` until ${expires.toUTCString()}` : ''}\nDeleted messages sent by the user for the past ${days} days`,
                    ephemeral: true
                })

            } else if (i.customId === 'ban_void') {
                // Do not ban user
                return i.reply({
                    content: 'The user was not banned',
                    ephemeral: true
                })
            }
        })

    }
}