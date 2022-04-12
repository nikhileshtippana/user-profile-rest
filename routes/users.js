const express = require('express')
const Joi = require('joi')
const User = require('./../models/user')
const router = express.Router()

// routes
router.get('/', async (req, res) => {
    const filter = {}

    function updateFilter(key) {
        const val = req.query[key]
        if (val) {
            const searchVal = req.query.exact !== undefined ? val : new RegExp(val, 'i')
            filter[key] = searchVal
        }
    }

    if (req.query.keyword) {
        const searchVal = req.query.exact !== undefined ? req.query.keyword : new RegExp(req.query.keyword, 'i')
        filter.$or = [
            { firstName: searchVal },
            { middleName: searchVal },
            { lastName: searchVal },
            { prefix: searchVal },
            { suffix: searchVal },
            { email: searchVal },
            { phone: searchVal }
        ]
    } else {
        updateFilter('firstName')
        updateFilter('middleName')
        updateFilter('lastName')
        updateFilter('prefix')
        updateFilter('suffix')
        updateFilter('email')
        updateFilter('phone')
    }

    const sort = req.query.sort?.replace(',', ' ') ?? ''

    const users = await User.find(filter).sort(sort)
    if (!users || users.length === 0) return res.status(404).send()
    res.send(users)
})

router.get('/:id', validateId, findById, (req, res) => {
    res.send(req.user)
})

router.post('/', validateUser, async (req, res, next) => {
    let userId = (req.body.lastName.substring(0, 6) + req.body.firstName).substring(0, 7).toLowerCase()

    const users = await User.find({ userId: new RegExp("^" + userId) }).sort({ createdAt: 'desc' })

    if (users.length > 0) {
        const suffix = users[0].userId.substring(userId.length)
        const index = suffix === '' ? 0 : parseInt(suffix)
        userId += (index + 1 )
    }
    
    const user = new User()
    user.userId = userId
    user.createdAt = new Date(req.body.createdAt)
    user.createdBy = req.body.createdBy
    req.user = user
    next()
}, populateAndSave)

router.put('/:id', validateId, findById, validateUser, (req, res, next) => {
    req.user.updatedAt = new Date(req.body.updatedAt)
    req.user.updatedBy = req.body.updatedBy
    next()
}, populateAndSave)

router.delete('/:id', validateId, findById, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id)
        res.status(204).send()
    } catch (err) {
        console.error(err)
        res.status(500).send("Something went wrong")
    }
})

// functions
function validateId(req, res, next) {
    const { error } = Joi.string().length(24).validate(req.params.id)
    if (error) return res.status(400).send('Invalid id')
    next()
}

async function findById(req, res, next) {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send()
    req.user = user
    next()
}

function validateUser(req, res, next) {
    let rules = {
        firstName: Joi.string().alphanum().min(3).max(30).required(),
        middleName: Joi.string().allow('').alphanum().max(30),
        lastName: Joi.string().alphanum().min(3).max(30).required(),
        prefix: Joi.string().allow(''),
        suffix: Joi.string().allow(''),
        email: Joi.string().allow('').email(),
        phone: Joi.string().allow('').length(10).pattern(/^[0-9]+$/, 'numbers')
    }

    if (req.method === 'POST') {
        rules.createdAt = Joi.date().required(),
        rules.createdBy = Joi.string().min(3).required()
    } else {
        rules.updatedAt = Joi.date().greater(req.user.createdAt).required(),
        rules.updatedBy = Joi.string().min(3).required()
    }

    const { error } = Joi.object(rules).validate(req.body, { stripUnknown: true })
    if (error) return res.status(400).send(error.details[0].message)
    next()
}

async function populateAndSave(req, res) {
    let user = req.user
    user.firstName = req.body.firstName
    user.middleName = req.body.middleName ?? user.middleName
    user.lastName = req.body.lastName
    user.prefix = req.body.prefix ?? user.prefix
    user.suffix = req.body.suffix ?? user.suffix
    user.email = req.body.email ?? user.email
    user.phone = req.body.phone ?? user.phone

    try {
        user = await user.save()
        res.status(req.method === 'POST' ? 201 : 200).send(user)
    } catch (err) {
        console.error(err)
        res.status(500).send("Something went wrong")
    }
}

module.exports = router