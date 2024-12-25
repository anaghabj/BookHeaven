const express = require("express");

const router = express.Router();

const userController = require("../controllers/user/userController");
const passport = require("passport");
const productController = require('../controllers/user/productController')

const {userAuth,adminAuth}=require('../middlewares/auth')

const profileController = require('../controllers/user/profileController')
const wishlistController = require('../controllers/user/wishlistController')

const cartController = require('../controllers/user/cartController')

const orderController = require('../controllers/user/orderController')

router.get('/pageNotFound',userController.pageNotFound)
router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup",userController.signup)
router.post("/verify-otp",userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
res.redirect('/')
})

router.get('/login',userController.loadlogin);

router.post('/login',userController.login)

router.get('/logout',userController.logout);


router.get("/productDetails",userAuth,productController.productDetails)

router.get('/forgot-password',profileController.getForgotPassPage);

router.post('/forgot-email-valid',profileController.forgotEmailValid);

router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp);

router.get('/reset-password',profileController.getResetPassPage);

router.post('/resend-forgot-otp',profileController.resendOtp);

router.post("/reset-password",profileController.postNewPassword);

router.get('/product-list',productController.productList);

router.get('/userProfile',userAuth,profileController.userProfile);

router.get('/change-email',userAuth,profileController.changeEmail);

router.post('/change-email',userAuth,profileController.changeEmailValid);

router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp);

router.post('/update-email',userAuth,profileController.updateEmail);

router.get('/change-password',userAuth,profileController.changePassword)

router.post('/change-password',userAuth,profileController.changePasswordValid);

router.post('/verify-changePassword-otp',userAuth,profileController.verifyChangePassOtp);

router.get("/addAddress",userAuth,profileController.addAddress);

router.post('/addAddress',userAuth,profileController.postAddAddress);


router.get('/editAddress',userAuth,profileController.editAddress);

router.post('/editAddress',userAuth,profileController.postEditAddress);

router.get('/deleteAddress',userAuth,profileController.deleteAddress)


router.get('/shop',userAuth,userController.loadShoppingPage)

router.get('/filter',userAuth,userController.filterProduct);

router.get('/filterPrice',userAuth,userController.filterPrice);

router.post('/search',userAuth,userController.searchProducts)


router.get('/wishlist',userAuth,wishlistController.loadWishlist)

router.post('/addToWishlist',userAuth,wishlistController.addToWishlist)

router.get('/removeFromWishlist',userAuth,wishlistController.removeProduct)

router.get("/cart", userAuth, cartController.getCartPage)
router.post("/addToCart",userAuth, cartController.addToCart)
router.post("/changeQuantity", userAuth,cartController.changeQuantity)
router.get("/deleteItem", userAuth, cartController.deleteProduct)


router.get('/checkout',userAuth,orderController.getCheckoutPage);


router.post('/orderPlaced', userAuth, orderController.orderPlaced);





// Delete product from cart
router.get('/delete-product', orderController.deleteProduct);

// Apply a coupon
router.post('/apply-coupon', orderController.applyCoupon);

// Place an order
router.post('/place-order', orderController.orderPlaced);

// Get order details
router.get('/order-details', orderController.getOrderDetailsPage);

// Confirm payment
router.post('/payment-confirm', orderController.paymentConfirm);

// Get cart checkout page
router.get('/cart-checkout', orderController.getCartCheckoutPage);

// Change single product status in an order
router.post('/change-product-status', orderController.changeSingleProductStatus);




module.exports = router;