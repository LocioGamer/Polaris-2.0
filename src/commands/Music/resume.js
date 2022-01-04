module.exports = {
    name: 'resume',
    description: 'Resumes the song currently paused',
    test: true,
    guildOnly: true,
    async execute({ interaction, client, guild, member }) {
        const voiceChannel = member.voice.channel
        const queue = client.distube.getQueue(guild)

        // Check if user is in a voice channel
        if (!voiceChannel)
            return 'You must be in a voice channel to use this command'

        // Check if bot is already in another channel
        if (guild.me.voice.channelId && voiceChannel.id !== guild.me.voice.channelId)
            return `I am playing in channel <#${guild.me.voice.channelId}>`

        // Check if there is currently a queue in this guild
        if (!queue || !client.distube.embedMessage || !client.distube.embed)
            return `There is no music playing in this server!`

        // Check if queue is already playing
        if (queue.playing)
            return `The music is already playing!`

        // Defer reply
        interaction.deferReply()

        // Pause queue
        await client.distube.resume(guild)

        // Edit embed
        let musicEmbed = client.distube.embed
        musicEmbed
            .setTitle('Songs Playing')
            .setDescription(`**Currently Playing:** *${queue.songs[0].name}*`)

        client.distube.embedMessage.edit({
            embeds: [musicEmbed]
        })

        // Finish deferral
        interaction.deleteReply()
    }
}