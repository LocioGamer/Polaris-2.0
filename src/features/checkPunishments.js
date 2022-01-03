const punishmentLogSchema = require(`@models/punishmentLog-schema`)

async function checkPunishments(client) {
    // Check for punishments
    const punishments = await punishmentLogSchema.find({
        expirationDate: {
            $lt: new Date()
        }
    })

    for (const punishment of punishments) {
        const { guildId, userId, punishment: punishmentType, punishmentId, staffId } = punishment

        // Check if guild exists
        const guild = await client.guilds.fetch(guildId)
        if (!guild)
            continue

        // Check if user is a member
        const targetMember = await guild.members.fetch(userId)
        if (!targetMember)
            continue

        // Check for bans
        if (punishmentType === 'Ban') {
            // Get last punishment id
            const punishment = await punishmentLogSchema.findOne({
                guildId,
                userId
            }, {}, { sort: { createdAt: -1 } })

            // Create a log of the unban
            await punishmentLogSchema.create({
                punishmentId: punishment ? punishment.punishmentId + 1 : 1,
                guildId,
                userId,
                punishment: 'Unban',
                reason: 'Ban duration expired',
                staffId: user.id,
            })

            guild.members.unban(userId, 'Ban duration expired')

        } else if (punishmentType === 'Mute') {
            const muteRole = guild.roles.cache.find((role) => role.name === 'Muted')

            // Check if the mute role exists
            if (!muteRole)
                continue

            // Check if user is already unmuted
            if (!targetMember.roles.cache.has((role) => role.name === 'Muted'))
                continue

            // Get last punishment id
            const punishment = await punishmentLogSchema.findOne({
                guildId: guild.id,
                userId
            }, {}, { sort: { createdAt: -1 } })

            // Create a log of the unmute
            await punishmentLogSchema.create({
                punishmentId: punishment ? punishment.punishmentId + 1 : 1,
                guildId,
                userId,
                punishment: 'Unmute',
                reason: 'Mute duration expired',
                staffId
            })

            // Remove the users muted role
            targetMember.roles.remove(muteRole)
        }

        // Remove the expiration date from the punishment
        await punishmentLogSchema.findOneAndUpdate(
            {
                guildId,
                userId,
                punishmentId
            },
            {
                expirationDate: null
            }
        )
    }
    setTimeout(checkPunishments, 1000 * 60, client)
}

module.exports = checkPunishments