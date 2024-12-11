const User = require("../../models/userSchema");
const Joi = require('joi');
const Category = require("../../models/categorySchema");
const Product = require('../../models/productSchema')
const env = require("dotenv").config()
const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt')

const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const pageNotFound = async(req,res) =>{
    try{
        res.render('Page-404')

    }catch(error){
        res.redirect('/pageNotFound')

    }

}



const loadHomepage = async (req, res) => {
    try {
        const user = req.session.user ;

        // Fetch listed categories
        const categories = await Category.find({ isListed:true });

        // Fetch products that match the category IDs and other conditions
        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            quantity: { $gt: 0 }
        });

        // Sort products by creation date (most recent first) and limit to 4
        productData = productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn)).slice(0, 6);

        // If the user is logged in, fetch their details
        if (user) {
            const userData = await User.findById(user._id);
            return res.render('home', { user: userData, products: productData });
        }

        // If no user is logged in, render the page without user data
        return res.render("home", { products: productData });

    } catch (error) {
        console.error("Error loading homepage:", error.message);
        res.status(500).send("Server error");
    }
};


const loadSignup = async (req,res)=>{
    try{
        return res.render("signup")
    }catch(error){
        console.log('Home page not loading:',error);
        res.status(500).send("server error")

    }
}

function generateOtp(){
    return Math.floor(100000 + Math.random()*90000).toString();
}

async function sendVerificationEmail(email,otp){
    try{

        const transporter = nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })



        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to: email,
            subject:"Verify Your Account",
            text:`Your OTP is ${otp}`,
            html:`<b>Your OTP:${otp}</b>`
        })
        return info.accepted.length > 0

    }catch(error){

        console.error('Error Sending email',error)
        return false

    }
}

const signup = async(req,res)=>{
    try{
const {name,phone,email,password,cPassword}=req.body;
if(password !==cPassword){
    return res.render('signup',{message:"passwords do not match"})
}
const findUser = await User.findOne({email});
if(findUser){
    return res.render("signup",{message:"user with this email already exists"})
}
const otp = generateOtp();
const emailSend=await sendVerificationEmail(email,otp)
if (!emailSend){
    return res.json("email-error")
}
req.session.userOtp = otp;
req.session.userData = {name,phone,email,password};
res.render("verify-otp")
console.log('OTP send',otp)

    }catch(error){

        console.error("signup error",error);
        res.redirect('/pageNotFound')

    }
}

const securePassword = async(password)=>{
    try{
        const passwordHash =await bcrypt.hash(password,10)
        return passwordHash;

    }catch(error){

    }
}

const verifyOtp = async(req,res)=>{
    try{
        const {otp}=req.body;
        console.log(otp);
        if(otp===req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash,



            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({success:true,redirectUrl:'/'})


        }else{
            res.status(400).json({success:false,message:"Invalid OTP,Please try again"})
        }
    }catch(error){
        console.error('Error Verifying OTP',error)
        res.status(500).json({success:false,message:"An error occured"})
            
    }
}

const resendOtp =async (req,res)=>{
    try{
        const {email}=req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"email not founding session"})
        }
        const otp = generateOtp();
        req.session.userOtp =otp;
        const emailSend = await sendVerificationEmail(email,otp)
        if(emailSend){
            console.log('resend OTP:',otp)
            res.status(200).json({success:true,message:"OTP REsend Successfully"})
        }else{
            res.status(500).json({success:false,message:"Failed to Resend OTP,Please try again"})
        }

    }catch(error){
        console.error("Error resending OTP",error)
        res.status(500).json({success:false,message:"Internal Server Error,please try again"})

    }
}

const loadlogin = async(req,res)=>{
    try{
        if(!req.session.user){
            return res.render('login');
        }else{
            res.redirect('/')
        }

    }catch(error){
        res.redirect('/pageNotFound')

    }
}



const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const findUser = await User.findOne({ isAdmin: 0, email: email });
        if (!findUser) {
            return res.render('login', { message: "User not Found" }); // Return after rendering
        }

        // Check if user is blocked
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect Password" });
        }

        // Save user to session
        req.session.user = {
            _id: findUser._id,
            name: findUser.name, // Add name if needed
            email: findUser.email, // Add email if needed
        };

        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { message: "Login failed, please try again later" });
    }
};


const logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log('Session destruction error')
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/login')
        })
    } catch (error) {
        console.log('logout error',error)
        res.redirect('/pageNotFound')
        
    }
}
module.exports ={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadlogin,
    login,
    logout
};