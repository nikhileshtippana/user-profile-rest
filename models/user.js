const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        required: true
    },
    prefix: {
        type: String,
        default: ''
    },
    suffix: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
    updatedBy: {
        type: String,
        required: true
    }
})

userSchema.pre('validate', function(next) {
    if (!this.userId) {
        this.userId = this.lastName.substring(0, 5) + this.firstName
        this.userId = this.userId.substring(0, 6)
    }

    if (!this.updatedAt) {
        this.updatedAt = this.createdAt
    }

    if (!this.updatedBy) {
        this.updatedBy = this.createdBy
    }

    next()
})

module.exports = mongoose.model('User', userSchema)