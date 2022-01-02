const mongoose = require('mongoose')
const { Schema } = mongoose

const reqString = {
    type: String,
    required: true
}

const reqInt = {
    type: Number,
    required: true
}

const autoModerationSchema = new Schema(
    {
        guildId: reqString,
        autoPunishments: [
            {
                warnAmount: reqInt,
                punishment: reqString,
                punishmentLength: reqInt,
                punishmentLengthUnit: reqString
            }
        ],
    }
)

module.exports = mongoose.models['autoModerations'] || mongoose.model('autoModerations', autoModerationSchema)