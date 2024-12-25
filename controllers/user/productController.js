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





// const productList = async (req, res) => {
//     try {
//         const user = req.session.user;

        
//         const categories = await Category.find({ isListed: true });

//         const searchQuery = req.query.search || ''; 
//         const page = parseInt(req.query.page) ||1; 
//         const ITEMS_PER_PAGE = 9; 

       
//         let productQuery = {
//             isBlocked: false,
//             category: { $in: categories.map(category => category._id) },
//             quantity: { $gte: 0 },
//         };

//         if (searchQuery) {
//             productQuery.productName = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
//         }

        
//         const totalProducts = await Product.countDocuments(productQuery);
//         const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        
//         const products = await Product.find(productQuery)
//             .skip((page - 1) * ITEMS_PER_PAGE)
//             .limit(ITEMS_PER_PAGE)
//             .sort({ createdOn: -1 }); 

       
//         if (user) {
//             const userData = await User.findById(user._id);
//             return res.render('product-list', { 
//                 user: userData,
//                 products: products,
//                 currentPage: page,
//                 totalPages: totalPages,
//                 searchQuery: searchQuery,
//             });
//         }

        
//         return res.render("product-list", { 
//             products: products,
//             currentPage: page,
//             totalPages: totalPages,
//             searchQuery: searchQuery,
//         });

//     } catch (error) {
//         console.error("Error loading product list:", error.message);
//         res.status(500).send("Server error");
//     }
// };


const productList = async (req, res) => {
    try {
        const user = req.session.user;

        // Fetch listed categories
        const categories = await Category.find({ isListed: true });

        // Handle search and sorting queries
        const searchQuery = req.query.search || ''; // Capture search term, if any
        const sortOption = req.query.sort || ''; // Capture sort option from query
        const page = parseInt(req.query.page) || 1; // Get the current page from query, default to 1
        const ITEMS_PER_PAGE = 9; // Define how many products per page

        // Build query for search and filtering
        let productQuery = {
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            quantity: { $gte: 0 },
        };

        if (searchQuery) {
            productQuery.productName = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
        }

        // Define sorting logic based on sortOption
        let sortCriteria = {};
        switch (sortOption) {
            case 'popularity':
                sortCriteria = { popularity: -1 }; // Sort by popularity (descending)
                break;
            case 'priceLowToHigh':
                sortCriteria = { salePrice: 1 }; // Sort by price (ascending)
                break;
            case 'priceHighToLow':
                sortCriteria = { salePrice: -1 }; // Sort by price (descending)
                break;
            case 'averageRatings':
                sortCriteria = { averageRating: -1 }; // Sort by average ratings (descending)
                break;
            case 'featured':
                sortCriteria = { isFeatured: -1 }; // Sort by featured products
                break;
            case 'newArrivals':
                sortCriteria = { createdOn: -1 }; // Sort by creation date (newest first)
                break;
            case 'aToZ':
                sortCriteria = { productName: 1 }; // Sort alphabetically (A to Z)
                break;
            case 'zToA':
                sortCriteria = { productName: -1 }; // Sort alphabetically (Z to A)
                break;
            default:
                sortCriteria = { createdOn: -1 }; // Default to newest arrivals
        }

        // Fetch products matching the query with pagination and sorting
        const totalProducts = await Product.countDocuments(productQuery);
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

        const products = await Product.find(productQuery)
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
            .sort(sortCriteria); // Apply sorting criteria

        // If the user is logged in, fetch their details
        if (user) {
            const userData = await User.findById(user._id);
            return res.render('product-list', { 
                user: userData,
                products: products,
                currentPage: page,
                totalPages: totalPages,
                searchQuery: searchQuery,
                sortOption: sortOption,
            });
        }

        // If no user is logged in, render the page without user data
        return res.render("product-list", { 
            products: products,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery,
            sortOption: sortOption,
        });

    } catch (error) {
        console.error("Error loading product list:", error.message);
        res.status(500).send("Server error");
    }
};









module.exports={
    productDetails,
    productList

}