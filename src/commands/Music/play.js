const { MessageEmbed, DiscordAPIError } = require("discord.js")

module.exports = {
    name: 'play',
    description: 'Plays a song in the channel',
    test: true,
    guildOnly: true,
    options: [
        {
            name: 'query',
            description: 'Name or song URL',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.STRING,
        }
    ],
    async execute({ interaction, client, guild, channel, member }) {
        const voiceChannel = member.voice.channel
        const query = interaction.options.getString('query')

        // Check if user is in a voice channel
        if (!voiceChannel)
            return 'You must be in a voice channel to use this command'

        // Check if bot is already in another channel
        if (guild.me.voice.channelId && voiceChannel.id !== guild.me.voice.channelId)
            return `I am already playing in channel <#${guild.me.voice.channelId}>`

        // Wait for reply
        interaction.deferReply({ ephemeral: true })

        // Begin playing music and get queue
        await client.distube.playVoiceChannel(voiceChannel, query, { textChannel: channel, member })
        const queue = client.distube.getQueue(guild)
        console.log(queue)

        // Create embed
        let playEmbed = new MessageEmbed()
            .setColor('DARK_AQUA')
            .setTitle('Songs Playing')
            .setDescription(`**Currently Playing:** *${song.name}*`)
            .setTimestamp()
            .setImage(song.thumbnail)

        // Add queue if it exists
        if (client.distube.queues.get(guild)) {
            console.log(client.distube.queues.get(guild))
            let i = 2
            for (queueSong of client.distube.queues.get(guild).songs)
                playEmbed.addField(`#${i++}`, `${queueSong.name}`)
        }

        /*
        for (song of client.distube.getQueue()) {
            console.log(song)
        }*/

        // Reply with embed
        return interaction.editReply({
            embeds: [playEmbed],
            ephemeral: true
        })
    }
}