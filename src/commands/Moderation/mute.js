const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js")
const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'mute',
    description: 'Mutes a user on the server',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to be muted',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'duration',
            description: 'Amount of time for the user to be muted (Indefinite by default)',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
        },
        {
            name: 'reason',
            description: 'The reason for the mute',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    async execute({ interaction, guild, channel, targetUser, targetMember, user }) {
        const duration = interaction.options.getString('duration')
        const reason = interaction.options.getString('reason') || 'Silenced!'
        const muteRole = guild.roles.cache.find((role) => role.name === 'Muted')

        // Check if user is guild member
        if (!targetMember)
            return `The user <@${targetUser.id}> is not in this guild`

        // Check if the mute role exists
        if (!muteRole)
            return `This server does not have a 'Muted' role`

        // Check if user is already muted
        if (targetMember.roles.cache.find(muteRole))
            return `This user is already muted on this server`

            
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
        const muteConfirmationEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Mute Confirmation')
            .setDescription(`Are you sure you would like to mute the user <@${targetUser.id}>${expires ? ` until ${expires.toUTCString()}` : ''}?`)
            .setTimestamp()

        // Create buttons
        const muteConfirmationButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('mute_confirm')
                    .setLabel('Yes')
                    .setStyle('SUCCESS')
            )
            .addComponents(
                new MessageButton()
                    .setCustomId('mute_void')
                    .setLabel('No')
                    .setStyle('DANGER')
            )

        await interaction.reply({
            embeds: [muteConfirmationEmbed],
            components: [muteConfirmationButtons],
            ephemeral: true
        })

        // On button click
        const filter = i => (i.customId === 'mute_confirm' || i.customId === 'mute_void') && i.user.id === user.id
        const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 })
        collector.on('collect', async i => {
            if (i.customId === 'mute_confirm') {

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
                    punishment: 'Mute',
                    reason: reason,
                    staffId: user.id,
                    expirationDate: expires
                })

                // Give user muted role
                targetMember.roles.add(muteRole)

                return i.reply({
                    content: `Muted the user <@${targetUser.id}> for reason *${reason}*${expires ? ` until ${expires.toUTCString()}` : ''}`,
                    ephemeral: true
                })

            } else if (i.customId === 'mute_void') {
                // Do not mute user
                return i.reply({
                    content: 'The user was not muted',
                    ephemeral: true
                })
            }
        })
    }
}