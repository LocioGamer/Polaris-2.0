const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'warn',
    description: 'Adds a warning to a user',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'user',
            description: 'The user to add a warning to',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.USER
        },
        {
            name: 'reason',
            description: 'The reason for the warning',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING
        }
    ],
    async execute({ interaction, guild, targetUser, user }) {
        const reason = interaction.options.getString('reason') || 'Thou hath been warned'

        // Get last punishment id
        const punishment = await punishmentLogSchema.findOne({
            guildId: guild.id,
            userId: targetUser.id
        }, {}, { sort: { createdAt: -1 } })

        // Create a warning
        await punishmentLogSchema.create({
            punishmentId: punishment ? punishment.punishmentId + 1 : 1,
            guildId: guild.id,
            userId: targetUser.id,
            punishment: 'Warning',
            reason: reason,
            staffId: user.id,
        })

        return `Added warning to <@${targetUser.id}>`
    }
}