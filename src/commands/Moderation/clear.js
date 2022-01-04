module.exports = {
    name: 'clear',
    description: 'Clears an amount of messages in the chat',
    test: true,
    options: [
        {
            name: 'amount',
            description: 'Amount of messages to be cleared',
            required: true,
            type: Discord.Constants.ApplicationCommandOptionTypes.INTEGER,
            min_value: 1,
            max_value: 100
        },
    ],
    async execute({ interaction, channel }) {
        const amount = interaction.options.getInteger('amount')

        // Clear messages
        let cleared
        await channel.messages.fetch({ limit: amount }).then(async (messages) => {
            cleared = await channel.bulkDelete(messages, true)
        })

        // Check if all messages cleared
        if (cleared.size !== amount)
            return `Cleared ${cleared.size} message${cleared.size === 1 ? '' : 's'} since some messages could not be deleted`

        return `Cleared ${amount} message${amount === 1 ? '' : 's'}`
    }
}