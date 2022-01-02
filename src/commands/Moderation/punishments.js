const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js")

const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'punishments',
    description: 'Manages punishments',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'get',
            description: 'Retrieves a list of a users punishments',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
                {
                    name: 'user',
                    description: 'The user to retrieve the punishments for',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.USER
                }
            ]
        },
        {
            name: 'remove',
            description: 'Removes a punishment from a user',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
                {
                    name: 'user',
                    description: 'The user to clear the punishments for',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.USER
                },
                {
                    name: 'id',
                    description: 'The id of the punishment to remove',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                    min_value: 1
                }
            ]
        },
        {
            name: 'clear',
            description: 'Clears all punishments a user ever had',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
                {
                    name: 'user',
                    description: 'The user to clear the punishments for',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.USER
                }
            ]
        }
    ],
    async execute({ interaction, guild, channel, subCommand, targetUser, user }) {

        if (subCommand === 'get') {
            // Lists all punishments
            const punishments = await punishmentLogSchema.find({
                guildId: guild.id,
                userId: targetUser.id
            })

            const punishmentsListEmbed = new MessageEmbed()
                .setColor('DARK_AQUA')
                .setTitle('Punishments List')
                .setDescription(`All punishments for the user <@${targetUser.id}>:`)
                .setTimestamp()

            if (!punishments[0])
                punishmentsListEmbed.setDescription(`No punishments for user <@${targetUser.id}>`)

            for (const punishment of punishments) {
                punishmentsListEmbed.addField(`ID: #${punishment.punishmentId}`, `**Punishment:** ${punishment.punishment}\n**Reason:** ${punishment.reason}\n**Date:** ${punishment.createdAt.toUTCString()}\n**Punished by:** <@${punishment.staffId}>${punishment.expirationDate ? `\n**Expires:** ${punishment.expirationDate.toUTCString()}`: ''}`)
            }

            return interaction.reply({
                embeds: [punishmentsListEmbed],
                ephemeral: true
            })
        } else if (subCommand === 'remove') {
            // Remove one punishment from the user
            const id = interaction.options.getInteger('id')

            const punishment = await punishmentLogSchema.findOne({
                guildId: guild.id,
                userId: targetUser.id,
                punishmentId: id
            })

            if (!punishment)
                return `The user <@${targetUser.id}> does not have a punishment with id #${id}`


            const punishmentRemoveConfirmationEmbed = new MessageEmbed()
                .setColor('DARK_AQUA')
                .setTitle('Remove Punishment Confirmation')
                .setDescription(`Are you sure you would like to remove punishment #${id} from the user <@${targetUser.id}>?`)
                .setTimestamp()

            const punishmentRemoveConfirmationButtons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('punishment_remove_confirm')
                        .setLabel('Yes')
                        .setStyle('SUCCESS')
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('punishment_remove_void')
                        .setLabel('No')
                        .setStyle('DANGER')
                )

            await interaction.reply({
                embeds: [punishmentRemoveConfirmationEmbed],
                components: [punishmentRemoveConfirmationButtons],
                ephemeral: true
            })

            // On button click
            const filter = i => (i.customId === 'punishment_remove_confirm' || i.customId === 'punishment_remove_void') && i.user.id === user.id
            const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 });
            collector.on('collect', async i => {
                if (i.customId === 'punishment_remove_confirm') {
                    // Remove a punishment from the user
                    await punishmentLogSchema.deleteOne({
                        guildId: guild.id,
                        userId: targetUser.id,
                        punishmentId: id
                    })

                    return i.reply({
                        content: `Removed the punishment from the user <@${targetUser.id}>`,
                        ephemeral: true
                    })

                } else if (i.customId === 'punishment_remove_void') {
                    // Do not clear punishments
                    return i.reply({
                        content: 'The users punishment was not removed',
                        ephemeral: true
                    })
                }
            })

            // Clear all punishments from the user
        } else if (subCommand === 'clear') {
            // Check how many punishments the user has
            const userPunishments = await punishmentLogSchema.find({
                guildId: guild.id,
                userId: targetUser.id
            })

            // Check if the length is 0
            if (!userPunishments.length)
                return `The user <@${targetUser.id}> does not have any punishments`
                

            const punishmentsClearConfirmationEmbed = new MessageEmbed()
                .setColor('DARK_AQUA')
                .setTitle('Clear Punishments Confirmation')
                .setDescription(`Are you sure you would like to remove **all** punishments (${userPunishments.length}) from the user <@${targetUser.id}>?`)
                .setTimestamp()

            const punishmentsClearConfirmationButtons = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('punishments_clear_confirm')
                        .setLabel('Yes')
                        .setStyle('SUCCESS')
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId('punishments_clear_void')
                        .setLabel('No')
                        .setStyle('DANGER')
                )

            await interaction.reply({
                embeds: [punishmentsClearConfirmationEmbed],
                components: [punishmentsClearConfirmationButtons],
                ephemeral: true
            })

            // On button click
            const filter = i => (i.customId === 'punishments_clear_confirm' || i.customId === 'punishments_clear_void') && i.user.id === user.id
            const collector = channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 15000, max: 1 });
            collector.on('collect', async i => {
                if (i.customId === 'punishments_clear_confirm') {
                    // Clear all punishments from the user
                    const { deletedCount } = await punishmentLogSchema.deleteMany({
                        guildId: guild.id,
                        userId: targetUser.id
                    })

                    return i.reply({
                        content: `Cleared all punishments (${deletedCount}) from the user <@${targetUser.id}>`,
                        ephemeral: true
                    })

                } else if (i.customId === 'punishments_clear_void') {
                    // Do not clear punishments
                    return i.reply({
                        content: 'The users punishments were not cleared',
                        ephemeral: true
                    })
                }
            })
        }
    }
}