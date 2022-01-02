const { MessageEmbed } = require("discord.js")

module.exports = {
    name: 'banlist',
    description: 'Shows a list of all banned users',
    test: true,
    guildOnly: true,
    async execute({ interaction, guild }) {
        const banlist = await guild.bans.fetch()

        // Create embed
        const banListEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Ban List')
            .setDescription('To unban a user use /unban')
            .setTimestamp()

        if (!banlist.size)
            banListEmbed.setDescription('There are no users banned on this server')

        banlist.forEach(user => {
            banListEmbed.addField(`@${user.user.username}#${user.user.discriminator}`, `Reason: *${user.reason}*`)
        })

        // Reply with embed
        interaction.reply({
            embeds: [banListEmbed],
            ephemeral: true
        }) 
    }
}