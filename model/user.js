const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new mongoose.Schema(
    {
    _id: {
        type: Schema.Types.ObjectId,
        auto: true,
        },
    firstName: {
            type: String,
            default: null,
        },
    lastName: {
            type: String,
            default: null,
        },
    email: {
            type: String,
            unique: true,
        },
    password: {
            type: String,
        },
});

module.exports = mongoose.model('user', userSchema);
