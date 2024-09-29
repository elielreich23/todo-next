const issueJwt = require('../utils/issueJwt')
const EmailDomain = require('../utils/grabUserEmailDomain')
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { BadRequestError } = require('../utils/CustomError');
require('dotenv').config()

const signup = async function(req, res) {
  const {email, password} = req.body
  if(!email || !password){
    if(!email){
      return res.status(401).json({success : false, message : "Email Field Missing, please review input"})
    }else if(!password){
      return res.status(401).json({success : false, message : "Password Field Missing, please review input"})
    }
  }else{
    const getIdentity = await User.findOne({ email : email.toLowerCase()}).exec()
    if(getIdentity){
      res.status(401).json({success: false, message : "Email Already in use"})
    }else{
      bcrypt.hash(password, Number(process.env.SALT_ROUNDS), function(err, password){
        const users = new User({
          email : email.toLowerCase(),
          password,
        })
        users.save()
        .then(async (users)=> {
          const toBeIssuedJwt = issueJwt.issueJwtConfirmEmail(users)
          const grabber = EmailDomain.grabEmailDomain(users)
          await confirmEmail.sendConfirmationMail(users,toBeIssuedJwt.token)
          res.status(200).json({success : true, message : "Account successfully created", emailDomain : grabber})
        })
        .catch(err => {
          console.log(err)
          res.status(400).send('An Error Occured, Invalid Input')
        })
      })
        
    }
  }
}

  const signin = async(req,res,next)=> {
    const {email,password} = req.body
    const user = await User.findOne({email : email.toLowerCase()}).exec()
    if(!user){
      return res.status(401).json({success : false, message : "User doesn't Exists"})
    }
    if(!user.password){
      return res.status(401).json({success : false, message : "Invalid Email or Password, Try another sign in option"})
    }
    const match = await bcrypt.compare(password, user.password);

    if(!match){
      return res.status(401).json({success : false, message : "Incorrect Password, Please check again and retry"})
    }else if(!user.emailConfirmedStatus){
      const toBeIssuedJwt = issueJwt.issueJwtConfirmEmail(user ||  syncUser)
      confirmEmail.sendConfirmationMail(user ||  syncUser,toBeIssuedJwt.token)
      return res.status(401).json({success : false, message : 'Oops.., Your email is yet to be confirmed, Kindly check your email for new confirmation Link'})
    }else{
      const toBeIssuedJwt = issueJwt.issueJwtLogin(user || syncUser)
      const userDetails = await User.findOne({email : email.toLowerCase()}).select('-password').exec()

      const syncUserDetails = await SyncUser.findOne({email : email.toLowerCase()}, "name email role").select('-tracklist').select('-password').exec()

      res.status(200).json({success : true, user : userDetails ||  syncUserDetails, message : 'Welcome back',token : toBeIssuedJwt.token, expires : toBeIssuedJwt.expires})
    }
 
  }

  const googleAuth = async(req,res,next)=>{
    try {
      const user = await User.findOne({email : req.body.email}).exec() 
      const syncUser = await SyncUser.findOne({email : req.body.email}).exec()
      let item = user || syncUser
      if (!item){
        if(req.body.role){
          const {userType} = EmailDomain.grabEmailDomain(req.body)
          if(req.body.role == "Music Uploader"){
            const user = new User({...req.body,authSource : 'googleAuth', userType})
            var newUser = await user.save()
            const dashboard = new Dashboard({
              user : newUser._id
            })
            await dashboard.save()
            newUser = newUser.toObject()
            delete newUser.password
          }else{
            const user = new SyncUser({...req.body,authSource : 'googleAuth', userType})
            var newSyncUser = await user.save()
            newSyncUser = newSyncUser.toObject()
            delete newSyncUser.password
          }
          item = newUser || newSyncUser
          let toBeIssuedJwt = issueJwt.issueJwtLogin(item)

          res.status(200).json({success : true, user : item, message : 'Welcome back',token : toBeIssuedJwt.token, expires : toBeIssuedJwt.expires})
        }else{
          return res.status(302).json({success : false, message : "You are yet to Identify with a role", path : '/selectRole'})
        }
        
      }else{
        let toBeIssuedJwt = issueJwt.issueJwtLogin(item)

        res.status(200).json({success : true, user : item, message : 'Welcome back',token : toBeIssuedJwt.token, expires : toBeIssuedJwt.expires})
      }
      
    } catch (error) {
      console.log(error)
      res.status(401).send(error)
    }
        
}

const allUsers = async (req,res,next) =>{
  const users = await User.find().exec()
  if(users){
    res.json({success : true, message : users})
  }else{
    res.json({success : false, message : "Error fetching users"})
  }
}

const getsyncuserinfo = async (req,res,next)=>{
  const userId = req.user._id
  const details = await SyncUser.findOne({_id : userId}).populate('tracklist', "artWork trackTitle mainArtist trackLink duration genre mood producers").populate('pendingLicensedTracks').select('-password').exec()
  res.send({user : details, success : true})
}

const profilesetup = async (req, res, next) => {
  if(req.user.userType == "Individual"){
    const {username, spotifyLink, bio} = req.body;
    const duplicateUsername = await User.findOne({username}).exec()
    if(duplicateUsername){
      throw new BadRequestError('Username in exist already')
    }
    await spotifyChecker.validateSpotifyArtistLink(spotifyLink)
    if (!username || !spotifyLink || !bio) {
      return res.status(401).json({success: false,message: 'Missing field please check andconfirm',})
    }  
  }else if(req.user.userType == "Company"){
    const {address, representative, phoneNumber} = req.body;
    if (!address || !representative || !phoneNumber) {
      return res.status(401).json({success: false,message: 'Missing field please check andconfirm',})
    } 
  }
  const userId = req.user._id;
  try {
    await User.findByIdAndUpdate(userId,req.body,{ new: true });
    res.status(200).json({success: true,message: 'Profile update successful'});
  } catch (error) {
    console.log(error)
    res.send(error)
  }
}

const profileUpdate = async (req,res,next)=>{
  const userId = req.user.id
  if(req.body.email || req.body.username){
    if(req.body.email !== req.user.email){
      return res.status(401).send('unauthorized buddy 😒, unable to make changes to email')
    }
    if(req.user.username){
      if(req.body.username !== req.user.username){
        const duplicateUsername = await User.findOne({username}).exec()
        if(duplicateUsername){
          throw new BadRequestError('Username in exist already')
        }
      }
    }
  }
  if(req.user.role == "Music Uploader"){
    if(req.file){
      var profilePicture = await cloudinary.uploader.upload(req.file.path)
      await User.findByIdAndUpdate(userId,{...req.body, img : profilePicture.secure_url}, {new : true}).exec()
      fs.unlinkSync(req.file.path)
      res.status(200).json({success : true, message : 'Profile update successful'})
    }else{
      await User.findByIdAndUpdate(userId,req.body,{new : true}).exec()
      res.status(200).json({success : true, message : 'Profile update successful'})
    }
  }
  else if(req.user.role == "Sync User")
  {
    if(req.file){
      var profilePicture = await cloudinary.uploader.upload(req.file.path)
      if(req.body.firstName  && req.body.lastName){
        var fullName = req.body.firstName + " " + req.body.lastName
      }
      const profileUpdate = await SyncUser.findByIdAndUpdate(userId,{...req.body, img : profilePicture.secure_url, name : fullName}, {new : true}).exec()
      fs.unlinkSync(req.file.path)
      res.status(200).json({success : true, message : 'Profile update successful', profileUpdate})
    }
    else{
      if(req.body.firstName  && req.body.lastName){
        var fullName = req.body.firstName + " " + req.body.lastName
      }
      const profileUpdate = await SyncUser.findByIdAndUpdate(userId,{...req.body, name : fullName},{new : true}).exec()
      res.status(200).json({success : true, message : 'Profile update successful', profileUpdate})
    }
  }else{
    res.status(401).send('Unauthorized')
  }    
}

const verifyEmail =  async (req,res,next)=>{
  if(req.user.emailConfirmedStatus){
      res.redirect('/AlreadyConfirmed')
  }
  else if(req.isAuthenticated()){
    if(req.user.role == "Music Uploader"){
      await User.findOneAndUpdate({_id : req.user._id},{emailConfirmedStatus : true},{new : true})
      res.redirect('/confirmedEmail')
    }else{
      await SyncUser.findOneAndUpdate({_id : req.user._id},{emailConfirmedStatus : true},{new : true})
      res.redirect('/confirmedEmail')
    }
      
  }else{
      res.redirect('/notConfirmed')
  }
}

const changePassword = async(req,res,next)=>{
  const {password, confirmPassword} = req.body
 if(req.isAuthenticated()){
  const userId = req.user.id
  if(password !== confirmPassword){
    return res.status(422).send('Password Mismatch please try again')
  }
  try {
    if(req.user.role == "Music Uploader"){
      bcrypt.hash(password, Number(process.env.SALT_ROUNDS), async function(err, hashPw){
        await User.findByIdAndUpdate(userId, {password : hashPw}, {new : true})
        res.status(200).json({success : true, message : 'Password Successfully Updated'})
      })
    }else if(req.user.role == "Sync User"){
      bcrypt.hash(password, Number(process.env.SALT_ROUNDS), async function(err, hashPw){

        await SyncUser.findByIdAndUpdate(userId, {password : hashPw}, {new : true})
        res.status(200).json({success : true, message : 'Password Successfully Updated'})
      })
    }
  } catch (error) {
    res.status(422).send("Invalid Email Address")
  }
 }else{
  res.status(400).send("Link Expired")
 }
}

const requestForgotPw = async (req,res,next)=>{
  const {email} = req.body

    const user = await User.findOne({email}).exec() || await SyncUser.findOne({email}).exec()
    console.log(user)

    if(user){
      const {token} = issueJwtForgotPassword(user)
      requestForgotPassword(user, token)
      res.status(200).send({success :  true, message : 'Kindly Check your Mail to Proceed'})
    }else{
      res.status(422).send("Invalid Emailee Address")
    }
}

module.exports = {signup, signin, googleAuth, allUsers, profileUpdate, verifyEmail, changePassword, requestForgotPw, getsyncuserinfo, profilesetup}

  