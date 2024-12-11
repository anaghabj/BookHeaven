const mongoose = require("mongoose");

const {Schema} = mongoose;


const orderSchema = new Schema ({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderedItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true

        },
        price:{
            type:Number,
            default:0

        },

    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discound:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true

    },
    address:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true

    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Processing','Shipped','Delivered','Return Request','Returned']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    coupenApplied:{
        type:Boolean,
        default:fale
    }

})

const Order = mongoose.model("Order",orderSchema);

module.exports = Order;