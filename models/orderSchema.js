// const mongoose = require("mongoose");

// const {Schema} = mongoose;


// const orderSchema = new Schema ({
//     orderId:{
//         type:String,
//         default:()=>uuidv4(),
//         unique:true
//     },
//     orderedItems:[{
//         product:{
//             type:Schema.Types.ObjectId,
//             ref:"Product",
//             required:true
//         },
//         quantity:{
//             type:Number,
//             required:true

//         },
//         price:{
//             type:Number,
//             default:0

//         },

//     }],
//     totalPrice:{
//         type:Number,
//         required:true
//     },
//     discound:{
//         type:Number,
//         default:0
//     },
//     finalAmount:{
//         type:Number,
//         required:true

//     },
//     address:{
//         type:Schema.Types.ObjectId,
//         ref:"User",
//         required:true

//     },
//     invoiceDate:{
//         type:Date
//     },
//     status:{
//         type:String,
//         required:true,
//         enum:['Pending','Processing','Shipped','Delivered','Return Request','Returned','confirmed']
//     },
//     createdOn:{
//         type:Date,
//         default:Date.now,
//         required:true
//     },
//     coupenApplied:{
//         type:Boolean,
//         default:false
//     }

// })

// const Order = mongoose.model("Order",orderSchema);

// module.exports = Order;




const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid"); // Import uuidv4 for unique order IDs

const { Schema } = mongoose;

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: () => uuidv4(), // Generate a unique ID for each order
        unique: true,
        required: true // Ensure this field is always present
    },
    orderedItems: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                default: 0
            }
        }
    ],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: { // Fixed typo: 'discound' to 'discount'
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        type: Schema.Types.ObjectId,
        ref: "User", // Ensure you have a User model where this references the address
        required: true
    },
    invoiceDate: {
        type: Date,
        default: Date.now // Default invoice date to the current date
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Return Request', 'Returned','Confirmed','Failed'] // Enum to validate status
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    couponApplied: { // Fixed typo: 'coupenApplied' to 'couponApplied'
        type: Boolean,
        default: false
    }
});

// Create the Order model
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
