const User = require("../../models/userSchema");
const Joi = require('joi');
const Category = require("../../models/categorySchema");
const Product = require('../../models/productSchema')
const env = require("dotenv").config()
const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt')

const passport = require("passport");
const category = require("../../models/categorySchema");
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

const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword } = req.body;

        // Check if passwords match
        if (password !== cPassword) {
            return res.render('signup', { message: "Passwords do not match" });
        }

        // Check if user already exists
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", { message: "User with this email already exists" });
        }

        // Generate OTP and send email
        const otp = generateOtp();
        const emailSend = await sendVerificationEmail(email, otp);
        if (!emailSend) {
            return res.json("email-error");
        }

        // Save OTP and user data in session
        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        console.log('OTP sent:', otp);
        res.render("verify-otp");
    } catch (error) {
        console.error("Signup error", error);
        res.redirect('/pageNotFound');
    }
};

const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.error("Error hashing password", error);
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        // Verify OTP
        if (otp === req.session.userOtp) {
            const user = req.session.userData;

            // Secure the password
            const passwordHash = await securePassword(user.password);

            // Save user to database
            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });
            await saveUserData.save();

            // Set session for auto-login
            req.session.user = {
                _id: saveUserData._id,
                name: saveUserData.name,
                email: saveUserData.email,
            };

            // Clear temporary session data
            req.session.userOtp = null;
            req.session.userData = null;

            res.json({ success: true, redirectUrl: '/' }); // Auto-login and redirect
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
        }
    } catch (error) {
        console.error('Error verifying OTP', error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        // Generate and send a new OTP
        const otp = generateOtp();
        req.session.userOtp = otp;
        const emailSend = await sendVerificationEmail(email, otp);

        if (emailSend) {
            console.log('Resent OTP:', otp);
            res.status(200).json({ success: true, message: "OTP resent successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP, please try again" });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).json({ success: false, message: "Internal Server Error, please try again" });
    }
};

const loadlogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('login');
        } else {
            res.redirect('/');
        }
    } catch (error) {
        res.redirect('/pageNotFound');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const findUser = await User.findOne({ isAdmin: 0, email });
        if (!findUser) {
            return res.render('login', { message: "User not found" });
        }

        // Check if user is blocked
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect password" });
        }

        // Save user to session
        req.session.user = {
            _id: findUser._id,
            name: findUser.name,
            email: findUser.email,
        };

        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { message: "Login failed, please try again later" });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.redirect('/pageNotFound');
            }
            return res.redirect('/login');
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/pageNotFound');
    }
};










const loadShoppingPage = async (req, res) => {
    try {
        // Get user session
        const user = req.session.user;
        if (!user) {
            throw new Error("User session not found");
        }

        // Fetch user data
        const userData = await User.findOne({ _id: user });
        if (!userData) {
            throw new Error("User data not found");
        }

        // Fetch categories
        const categories = await Category.find({ isListed: true });
        if (!categories || categories.length === 0) {
            throw new Error("No categories found");
        }

        // Prepare category IDs for filtering products
        const categoryIds = categories.map((category) => category._id.toString());

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        // Fetch products
        const products = await Product.find({
            isBlocked: false,
            category: { $in: categoryIds },
            quantity: { $gte: 0 },
        })
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        if (!products) {
            throw new Error("No products found");
        }

        // Calculate total pages
        const totalProducts = await Product.countDocuments({
            isBlocked: false,
            category: { $in: categoryIds },
            quantity: { $gte: 0 },
        });
        const totalPages = Math.ceil(totalProducts / limit);

        // Prepare categories for rendering
        const categoriesWithIds = categories.map((category) => ({
            _id: category._id,
            name: category.name,
        }));

        // Render the shop page
        res.render("shop", {
            user: userData,
            products: products,
            category: categoriesWithIds,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error("Error loading shopping page:", error.message);
        res.status(500).render("page-404", { errorMessage: error.message });
    }
};


// const filterProduct=async(req,res)=>{
//     try {
//         const user = req.session.user;
//         const category=req.query.category;
//         const findCategory = category? await Category.findOne({_id:category}) : null;
//         const query={
//             isBlocked:false,
//             quantity:{$gte:0}
//         }
//         if(findCategory){
//             query.category =findCategory._id
//         }

//         let findProducts = await Product.find(query).lean();
//         findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));

//         const categories=await Category.find({isListed:true});
//         let itemsPerPage = 6;
//         let currentPage=parseInt(req.query.page)||1;
//         let startIndex = (currentPage-1)*itemsPerPage;
//         let endIndex = startIndex+itemsPerPage;
//         let totalPages = Math.ceil(findProducts.length/itemsPerPage);
//         const currentProduct = findProducts.slice(startIndex,endIndex);
//         let userData = null;
//         if(user){
//             userData=await User.findOne({_id:user});
//             if(userData){
//                 const searchEntry  = {
//                     category:findCategory?findCategory._id:null,
//                     searchOn : new Date()

//                 }
//                 userData.searchHistory.push(searchEntry);
//                 await userData.save();
//             }
//         }
//         req.session.filteredProducts = currentProduct;
//         res.render('shop',{
//             user:userData,
//             productss:currentProduct,
//             category:categories,
//             totalPages,
//             currentPage,
//             selectedCategory:category || null
//         }) 


//     } catch (error) {
//         res.redirect('/pageNotFound');
        
//     }
// }






const filterProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const category = req.query.category || null;
        const findCategory = category ? await Category.findOne({ _id: category }) : null;
        
        const query = {
            isBlocked: false,
            quantity: { $gte: 0 },
        };
        
        if (findCategory) {
            query.category = findCategory._id;
        }
        
        let findProducts = await Product.find(query).lean();
        findProducts.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        
        const categories = await Category.find({ isListed: true });
        const itemsPerPage = 6;
        let currentPage = parseInt(req.query.page) || 1;
        const totalPages = Math.ceil(findProducts.length / itemsPerPage);
        
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentProduct = findProducts.slice(startIndex, startIndex + itemsPerPage);
        
        let userData = null;
        if (user) {
            userData = await User.findOne({ _id: user });
            if (userData) {
                if (!userData.searchHistory) {
                    userData.searchHistory = [];
                }
                const searchEntry = {
                    category: findCategory ? findCategory._id : null,
                    searchOn: new Date(),
                };
                userData.searchHistory.push(searchEntry);
                await userData.save();
            }
        }
        
        res.render('shop', {
            user: userData,
            products: currentProduct,
            category: categories,
            totalPages,
            currentPage,
            selectedCategory: category || null,
        });
    } catch (error) {
        console.error("Error in filterProduct:", error);
        res.redirect('/pageNotFound');
    }
};


const filterPrice=async(req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        const categories=await Category.find({isListed:true}).lean();
        let findProducts = await Product.find({
            salePrice:{$gt:req.query.gt,$lt:req.query.lt},
            isBlocked:false,
            quantity:{$gt:0}
        }).lean()

        findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))

        let itemsPerPage=6;
        let currentPage = parseInt(req.query.page)||1;
        let startIndex=(currentPage-1)*itemsPerPage;
        let endIndex= startIndex+itemsPerPage;
        let totalPages=Math.ceil(findProducts.length/itemsPerPage);
        const currentProduct=findProducts.slice(startIndex,endIndex)
        req.session.filteredProducts = findProducts;
        res.render('shop',{
            user:userData,
            products:currentProduct,
            category:categories,
            totalPages,
            currentPage
        })

    } catch (error) {
        
        console.log(error);
        res.redirect('/pageNotFound')
    }
}


const searchProducts=async(req,res)=>{
    try {


        const user =req.session.user;
        const userData=await User.findOne({_id:user});
        let search = req.body.query;
        const categories = await Category.find({isListed:true}).lean();
        const categoryIds = categories.map(category=>category._id.toString());
        let searchResult =[];
        if(req.session.filteredProducts && req.session.filteredProducts.length>0){
            searchResult = req.session.filteredProducts.filter(product=>
                product.productName.toLowerCase().includes(search.toLowerCase())
            )
        }else{
            searchResult = await Product.find({
                productName:{$regex:".*"+search+".*",$options:"i"},
                isBlocked:false,
                quantity:{$gte:0},
                category:{$in:categoryIds}
            })
        }
        searchResult.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));
        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page)||1;
        let startIndex=(currentPage-1)*itemsPerPage;
        let endIndex = startIndex+itemsPerPage;
        let totalPages = Math.ceil(searchResult.length/itemsPerPage);
         const currentProduct = searchResult.slice(startIndex,endIndex);
         res.render('shop',{
            user:userData,
            products:currentProduct,
            category:categories,
            totalPages,
            currentPage,
            count:searchResult.length,

         })

        
    } catch (error) {
        
        console.log('Error:',error);
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
    logout,
    loadShoppingPage,
    filterProduct,
    filterPrice,
    searchProducts
};