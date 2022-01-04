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

        // Defer reply
        interaction.deferReply()

        // Begin playing music and get queue
        await client.distube.playVoiceChannel(voiceChannel, query, { textChannel: channel, member })
        const queue = client.distube.getQueue(guild)

        // Check if embed already exists
        if (client.distube.embedMessage) {
            let musicEmbed = client.distube.embed

            // Add all new songs to the queue
            for (let i = musicEmbed.fields.length + 1; i < queue.songs.length; i++)
                musicEmbed.addField(`#${i + 1}`, `${queue.songs[i].name}`)

            client.distube.embedMessage.edit({
                embeds: [musicEmbed]
            })
        } else {
            // Otherwise create embed
            let musicEmbed = new MessageEmbed()
                .setColor('DARK_AQUA')
                .setTitle('Songs Playing')
                .setDescription(`**Currently Playing:** *${queue.songs[0].name}*`)
                .setTimestamp()
                .setImage(queue.songs[0].thumbnail)

            // Add queue if it exists
            if (client.distube.queues.get(guild)) {
                let i = 1
                for (queueSong of client.distube.queues.get(guild).songs)
                    // Don't add first song
                    if (i === 1)
                        i++
                    else
                        musicEmbed.addField(`#${i++}`, `${queueSong.name}`)
            }

            // Send embed and add to distube
            client.distube.embed = musicEmbed
            channel.send({
                embeds: [musicEmbed]
            }).then((message) => {
                client.distube.embedMessage = message
            })
        }

        // Finish deferral
        interaction.deleteReply()
    }
}