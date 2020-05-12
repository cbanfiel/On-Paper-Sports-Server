const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Request = require('../models/request');
const Roster = require('../models/roster');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    try{
        const user = await User.findOne({email: req.body.email})
        if(user){
            if(await bcrypt.compare(req.body.password, user.password)){
                res.status(200).json({user: {
                    _id: user._id,
                    user: user.user,
                    uploadsAllowed: user.uploadsAllowed
                }});
            }else{
                res.status(500).json({message: 'Wrong password'})
            }
        }else{
            res.status(500).json({message: 'Wrong email address'})
        }
    }catch(err) {
        res.status(500).json({message: err.message})
    }
})

router.post('/request/:id', getUser , async (req,res) => {
    if(res.user){
        let request = await Request.findOne({userId: req.params.id});
        if(request){
            res.status(400).json({message: 'You have already sent a request'})
        }else{
            let newRequest = new Request({userId: req.params.id})
            await newRequest.save();
            res.status(200).json({message: 'Request recieved'})
        }
    }else{
        res.status(500).json({message: 'Something went wrong'})
    }
})

//creating
router.post('/register', async (req, res) => {
    
    let user = await User.findOne({email: req.body.email});
    if(user){
        return res.status(409).json({message: 'You already have an account with that email'})
    }
    user = await User.findOne({user: req.body.user});
    if(user){
        return res.status(409).json({message: 'That username already exists'})
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password,10)
        const user = new User({
        user: req.body.user,
        password: hashedPassword,
        email: req.body.email,
        uploadsAllowed: 2
    })
        const newUser = await (user.save());
        res.status(201).json({user: {
            _id: user._id,
            user: user.user,
            uploadsAllowed: user.uploadsAllowed
        }});
    }catch(err){
        res.status(500).json({message: err.message})
    }
})


//updating
router.patch('/:id',getUser, async (req, res) => {
    if(req.body.user){
        res.user.user = req.body.user
    }
    if(req.body.password){
        res.user.password = req.body.password
    }
    if(req.body.email){
        res.user.email = req.body.email
    }
    try {
        const updatedUser = await res.user.save()
        res.json(updatedUser)
    } catch( error ) {
        res.status(400).json({message: "error updating user"})
    }
})

//deleting
router.post('/delete/:id',getUser, async (req, res) => {
    try {
        if (!await bcrypt.compare(req.body.password, res.user.password)) {
            return res.status(403).json({ message: 'Access Denied' });
        }
        let rosters = await Roster.find({userId: res.user._id})
        if(rosters){
            for (ros of rosters){
                await ros.remove();
            }
        }
        await res.user.remove()
        res.json({message: "Deleted user"})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})


async function getUser(req, res, next) {
    let user;
    try{
        user = await User.findById(req.params.id)
        if(user == null){
            return res.status(404).json({message: 'User not found'})
        }
    }catch(err){
        return res.status(500).json({message: err.message})
    }

    res.user = user;
    next();
}


module.exports = router;