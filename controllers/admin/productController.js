const User= require('../../models/userSchema');
const Product = require("../../models/productSchema");

const Category = require("../../models/categorySchema")

const fs = require("fs");

const path = require("path");
const sharp = require("sharp")

const getProductAddPage = async(req,res)=>{
    try {
        
        const category = await Category.find({isListed:true});
        res.render("product-add",{
            cat:category,


        })
    } catch (error) {
        res.redirect("/pageerror")
        
    }
}





const addProducts = async (req, res) => {
    try {
        const products = req.body;

        // Check if product already exists
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (productExists) {
            return res.status(400).json("Product already exists, please try with another name");
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const originalImagePath = req.files[i].path;
                const resizedImagePath = path.join('public', 'uploads', 'product-image', req.files[i].filename);

                // Resize the image using sharp
                await sharp(originalImagePath).resize({ width: 450, height: 450 }).toFile(resizedImagePath);
                images.push(req.files[i].filename);
            }
        }

        // Find the category by name
        const category = await Category.findOne({ name: products.category });
        if (!category) {
            return res.status(400).json("Invalid category name");
        }

        // Create and save the new product
        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            category: category._id,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice,
            createdOn: new Date(),
            quantity: products.quantity,
            productImage: images,
            status: "Available",
        });

        await newProduct.save();

        return res.redirect('/admin/addProducts');
    } catch (error) {
        console.error('Error saving Product:', error);
        return res.redirect('/admin/pageerror');
    }
};



// const getAllProducts= async(req,res)=>{
//     try {
//         const search = req.query.search || "";
//         const page = req.query.page || 1;
//         const limit = 4;
//         const productData = await Product.find({
//             productName:{$regex:new RegExp(".*"+search+".*","i")}
            
//         }).limit(limit*1)
//         .skip((page-1)*limit)
//         .populate('category','name')
//         .exec();

//         const count = await Product.find({productName:{$regex:new RegExp(".*"+search+".*","i")}}).countDocuments();

//         const category = await Category.find({isListed:true})
//         if(category){
//             res.render("products",{
//                 data:productData,
//                 currentPage:page,
//                 totalPages:Math.ceil(count/limit),
//                 cat:category,

//             })
            
//         }else{
//             res.render('page-404');
//         }
//     } catch (error) {
//         res.redirect('/pageerror')
        
//     }
// }



const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 4;

        // Fetch products and populate categories
        const productData = await Product.find({
            productName: { $regex: new RegExp(".*" + search + ".*", "i") },
        })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate("category", "name") // Populating the 'category' field
            .exec();

        const count = await Product.countDocuments({
            productName: { $regex: new RegExp(".*" + search + ".*", "i") },
        });

        // Fetch all listed categories
        const categories = await Category.find({ isListed: true });

        // Log for debugging
        // console.log("Product Data:", productData);
        // console.log("Categories:", categories);

        if (categories) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                categories, // Passing categories to the template
            });
        } else {
            res.render("page-404");
        }
    } catch (error) {
        console.error("Error fetching products or categories:", error);
        res.redirect("/pageerror");
    }
};





const addProductOffer=async(req,res)=>{
    try {
        const {productId,percentage}=req.body;
        const findProduct = await Product.findOne({_id:productId})
        const findCategory = await Category.findOne({_id:findProduct.category});
        if(findCategory.categoryOffer>percentage){
            return res.json({status:false,message:'This Products category already has a category offer'})
        }
        findProduct.salePrice = findProduct.salePrice-Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer=parseInt(percentage);
        await findProduct.save();
        findCategory.categoryOffer=0;
        await findCategory.save();
        res.json({status:true});

    } catch (error) {
        
            res.status(500).json({status:false,message:"internal server erroe"})
        
    }

}

// const removeProductOffer = async(req,res)=>{
//     try {
//         const {productId}=req.body;
//         const findProduct=await Product.findOne({_id:productId});
//         const percentage=findProduct.productOffer;
//         findProduct.salePrice=findProduct.salePrice+Math.floor(findProduct.regularPrice*(percentage/100))
        
//     } catch (error) {
//         res.redirect('/pageerror')
        
//     }
// }




const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;

        // Find the product by its ID
        const findProduct = await Product.findOne({ _id: productId });

        if (!findProduct) {
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        const percentage = findProduct.productOffer;

        if (percentage === 0) {
            return res.status(400).json({ status: false, message: "No product offer to remove" });
        }

        // Reverse the sale price calculation
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100));
        findProduct.productOffer = 0; // Reset the product offer

        await findProduct.save(); // Save the updated product

        res.json({ status: true, message: "Product offer removed successfully" });
    } catch (error) {
        console.error("Error in removing product offer:", error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};



const blockProduct=async(req,res)=>{
    try {
        let id =req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/products')
    } catch (error) {
        res.redirect("/pageerror")
    }

}

const unblockProduct=async(req,res)=>{
    try {
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/products")
        
    } catch (error) {
        res.redirect('/pageerror')
    }
}

const getEditProduct = async(req,res)=>{
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category=await Category.find({});
        res.render('edit-product',{
            product:product,
            cat:category
        })
        
    } catch (error) {
        res.redirect('/pageerror')
        
    }

}

const editProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findOne({_id:id});
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName:data.productName,
            _id:{$ne:id}
        })
        
        if(existingProduct){
            return res.status(400).json({error:'Product with this name already exists,please try with another name'})
        }

        const images = [];
        if(req.files && req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                images.push(req.files[i].filename)
            }
        }

        const updateFields = {
            productName:data.productName,
            description:data.description,
            category:product.category,
            regularPrice:data.regularPrice,
            salePrice:data.salePrice,
            quantity:data.quantity,

        }
        if(req.files.length>0){
            updateFields.$push={productImage:{$each:images}}
        }
        await Product.findByIdAndUpdate(id,updateFields,{new:true});
        res.redirect('/admin/products')
    } catch (error) {
        console.error(error);
        res.redirect('/pageerror')
        
    }

}

const deleteSingleImage=async(req,res)=>{
    try {
        const {imageNameToServer,productIdToServer}=req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
        const imagePath = path.join('public','uploads','re-image',imageNameToServer);
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`)
        }else{
            console.log(`Image ${imageNameToServer} not found`)
        }
        res.send({status:true})
    } catch (error) {
        res.redirect('/pageerror')
        
    }
}

module.exports ={
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    
    
}