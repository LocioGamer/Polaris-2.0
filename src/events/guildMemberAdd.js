const punishmentLogSchema = require(`@models/punishmentLog-schema`)

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Check if the user has any mutes
        const punishment = await punishmentLogSchema.findOne({
            guildId: member.guild.id,
            userId: member.id,
            punishment: 'Mute',
            expirationDate: {
                $gt: new Date()
            }
        })

        // Add muted role back
        if (punishment) {
            const mutedRole = member.guild.roles.cache.find((role) => role.name === 'Muted')
            if (mutedRole)
                member.roles.add(mutedRole)
        }
    }
}