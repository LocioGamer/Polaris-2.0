const { MessageEmbed } = require("discord.js")

module.exports = {
    name: 'announce',
    description: 'Announces a message to an announcement channel',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'message',
            description: 'The message that should be sent',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
        },
        {
            name: 'channel',
            description: 'The channel to send the message to (set a default in bot settings)',
            required: false,
            type: Discord.Constants.ApplicationCommandOptionTypes.CHANNEL,
            channelTypes: [0, 5, 10, 11]
        }
    ],
    async execute({ interaction, user }) {
        const announcementChannel = interaction.options.getChannel('channel')
        const message = interaction.options.getString('message')

        // Check if channel was provided
        if (!announcementChannel)
            return `No announcement channel found in settings`

        // Create embed
        const announcementEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Server Announcement')
            .addField(`${user.username} says:`, message)
            .setTimestamp()

        // Send embed in channel
        announcementChannel.send({
            embeds: [announcementEmbed]
        })

        // Reply with embed
        return `Announcement was made in channel <#${announcementChannel.id}>` 
    }
}