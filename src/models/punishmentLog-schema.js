const mongoose = require('mongoose')
const { Schema } = mongoose

const reqString = {
    type: String,
    required: true
}

const reqNum = {
    type: Number,
    required: true
}

const punishmentLogSchema = new Schema(
    {
        punishmentId: reqNum,
        guildId: reqString,
        userId: reqString,
        punishment: {
            type: String,
            required: true,
            enum: ['Ban', 'Unban', 'Mute', 'Unmute', 'Kick', 'Soft-Ban', 'Warn']
        },
        reason: String,
        staffId: reqString,
        expirationDate: Date
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.models['punishmentLog'] || mongoose.model('punishmentLog', punishmentLogSchema)