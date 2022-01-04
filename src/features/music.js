module.exports = function music(client) {
    client.distube.on(('finishSong'), queue => {
        // Check if there is another song in the queue
        if (queue[1])
            return

        // Edit music embed
        let musicEmbed = client.distube.embed
        musicEmbed
            .setDescription(`**Currently Playing:** *${queue.songs[1].name}*`)
            .setImage(queue.songs[1].thumbnail)
            .fields = []

        // Add rest of the queue
        let i = 0
        for (queueSong of queue.songs)
            // Don't add first song
            if (i < 2)
                i++
            else
                musicEmbed.addField(`#${i++}`, `${queueSong.name}`)

        client.distube.embedMessage.edit({
            embeds: [musicEmbed]
        })
    })
}