const Product = require('../../models/productSchema');

const Category = require('../../models/categorySchema')

const User = require('../../models/userSchema');


const productDetails = async(req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;
        const categoryOffer = findCategory ?. categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer+productOffer;
        res.render('product-details',{
            user:userData,
            product:product,
            quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory
        })

    } catch (error) {
        console.log('error for fetching product details',error);
        res.redirect("/pageNotFound")
        
    }
}

const productList = async (req, res) => {
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
            return res.render('product-list', { user: userData, products: productData });
        }

        // If no user is logged in, render the page without user data
        return res.render("product-list", { products: productData });

    } catch (error) {
        console.error("Error loading homepage:", error.message);
        res.status(500).send("Server error");
    }
};




module.exports={
    productDetails,
    productList

}