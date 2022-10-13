const UserModel = require('./../models/User');
const NoteModel = require('./../models/Note');

const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const { response } = require('express');

const getAllUsers = (async (req,res ) => {
    // return res.status(200).json({message: "ok done tested"});
    const users = await UserModel.find().select('-password').lean()
    if(!users?.length){
        return res.status(400).json({message: 'No users found'})
    }
    res.json(users)

})


const createNewUser = asyncHandler(async (req,res ) => {
    console.log(req);
    const {username, password, roles} = req.body;

    // confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({message: 'All fields are required'})
    }

    // check duplicate
    const duplicate = await UserModel.findOne({username}).lean().exec();
    if(duplicate){
        return res.status(409).json({message: 'Duplicate username'});
    }

    // Hash Password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, "password": hashedPwd, roles}

    // Create and store new user
    const user = await UserModel.create(userObject);

    if(user){
        return res.status(201).json({message: `New user ${username} created`});
    }else{
        return res.status(400).json({ message: 'Invalid user data received'})
    }
})


const updateUser = asyncHandler(async (req,res ) => {
    const {id, username, roles, active, password} = req.body

    // Confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
        return res.status(400).json({message: ' All fields are required'})
    }

    const user = await UserModel.findById(id).exec()
    console.log('user >> ',user)

    if(!user){
        return res.status(400).json({message: 'User not found'})
    }

    // Check for duplicate
    const duplicate = await UserModel.findOne({username}).lean().exec();
    // Allow updated to original user
    if(duplicate & duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate username'})
    }

    user.username = username
    user.roles = roles
    user.active =active 

    if(password){
        // Hash password
        user.password = await bcrypt.hash(password, 10) // salt rounds
    }

    const updatedUser = await user.save()

    res.json({message: `${updatedUser.username} updated`})
})


const deleteUser = asyncHandler(async (req,res ) => {
    const {id} = req.body;
    if(!id){
        return res.status(400).json({message: 'User ID Required'})
    }

    const note = await NoteModel.findOne({user: id}).lean().exec()
    if(note){
        return res.status(400).json({message: 'User has assigned notes'})
    }

    const user = await UserModel.findById(id).exec()

    if(!user){
        return res.status(400).json({message: 'User not found'})
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}