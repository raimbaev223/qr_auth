const mongoose = require('mongoose');
const {Schema} = mongoose;

const qrCodeSchema = new mongoose.Schema(
    {
    _id: {
        type: Schema.Types.ObjectId,
        auto: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users',
    },
    connectedDeviceId: {
        type: Schema.Types.ObjectId,
        ref: 'connectedDevices',
    },
    lastUsedDate: {
        type: Date,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('qrCode', qrCodeSchema);
