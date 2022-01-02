const { MessageEmbed } = require("discord.js")
const autoModerationSchema = require(`@models/autoModeration-schema`)

module.exports = {
    name: 'automod',
    description: 'Sets up the automoderation',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'add',
            description: 'Adds an automoderation setting',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
                {
                    name: 'warning-amount',
                    description: 'The amount of warnings required for this punishment',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                    min_value: 1,
                    max_value: 100
                },
                {
                    name: 'punishment',
                    description: 'The punishment that occurs',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                    choices: [
                        {
                            name: 'Mute',
                            value: 'MUTE'
                        },
                        {
                            name: 'Ban',
                            value: 'BAN'
                        },
                        {
                            name: 'Soft Ban',
                            value: 'SOFTBAN'
                        },
                        {
                            name: 'Kick',
                            value: 'KICK'
                        }
                    ]
                },
                {
                    name: 'punishment-length',
                    description: 'Length of the punishment (if applicable) (indefinite by default)',
                    required: false,
                    type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
                    min_value: 1,
                },
                {
                    name: 'punishment-length-unit',
                    description: 'The unit of the punishment length (days by default)',
                    required: false,
                    type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
                    choices: [
                        {
                            name: 'Minutes',
                            value: 'MINUTES'
                        },
                        {
                            name: 'Hours',
                            value: 'HOURS'
                        },
                        {
                            name: 'Days',
                            value: 'DAYS'
                        },
                        {
                            name: 'Weeks',
                            value: 'WEEKS'
                        }
                    ]
                }
            ]
        },
        {
            name: 'remove',
            description: 'Removes an automoderation setting',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: [
                {
                    name: 'id',
                    description: 'ID of the warning to remove',
                    required: true,
                    type: Discord.Constants.ApplicationCommandOptionTypes.STRING
                }
            ]
        },
        {
            name: 'remove-all',
            description: 'Removes all automoderation settings',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        },
        {
            name: 'list',
            description: 'Lists all automoderation settings',
            type: Discord.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        }
    ],
    async execute({ interaction, guild, subCommand }) {

        if (subCommand === 'add') {
            // Add a new automod
            await autoModerationSchema.findOneAndUpdate(
                {
                    guildId: guild.id
                },
                {
                    $push: {
                        autoPunishments: {
                            warnAmount: interaction.options.getInteger('warning-amount'),
                            punishment: interaction.options.getString('punishment'),
                            punishmentLength: interaction.options.getInteger('punishment-length') || -1,
                            punishmentLengthUnit: interaction.options.getInteger('punishment-length') ? interaction.options.getString('punishment-length-unit') || 'DAYS' : ''
                        }
                    }
                },
                {
                    upsert: true
                }
            )

            return 'Updated Automoderation settings. To view the current settings use /automod list'

        } else if (subCommand === 'remove') {
            // Remove an automod
            await autoModerationSchema.findOneAndUpdate(
                {
                    guildId: guild.id
                },
                {
                    $pull: {
                        autoPunishments: {
                            _id: interaction.options.getString('id'),
                        }
                    }
                }
            )

            return 'Updated Automoderation settings. To view the current settings use /automod list'

        } else if (subCommand === 'remove-all') {
            // Remove all automods
            await autoModerationSchema.findOneAndUpdate(
                {
                    guildId: guild.id
                },
                {
                    autoPunishments: []
                }
            )

            return 'Updated Automoderation settings. To view the current settings use /automod list'

        } else if (subCommand === 'list') {
            // List all automods
            const autoModerations = await autoModerationSchema.findOne({
                guildId: guild.id
            })

            const autoModerationsListEmbed = new MessageEmbed()
                .setColor('DARK_AQUA')
                .setTitle('Automod List')
                .setDescription(`All automod settings for this server:`)
                .setTimestamp()

            if (!autoModerations.autoPunishments[0])
                autoModerationsListEmbed.setDescription('No automod settings for this server. To add some use /automod add')

            for (const autoPunishment of autoModerations.autoPunishments) {
                const punishment = (autoPunishment.punishmentLength > 0) ?
                    `${autoPunishment.punishment} for ${autoPunishment.punishmentLength} ${autoPunishment.punishmentLengthUnit}`
                    : `${autoPunishment.punishment}`
                autoModerationsListEmbed.addField(`ID: ${autoPunishment._id}`, `Warnings: **${autoPunishment.warnAmount}**\nPunishment: **${punishment}**`)
            }

            return interaction.reply({
                embeds: [autoModerationsListEmbed],
                ephemeral: true
            })
        }
    }
}