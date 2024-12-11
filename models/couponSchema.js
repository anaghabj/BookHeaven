
const mongoose = require("mongoose");

const {Schema} = mongoose;

const couponSchema = new Schema ({
    name:{
        type:String,
        required:true,
        unique:true

    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:NUmber,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }]

})

const Coupon = mongoose.model("Coupen",couponSchema)

module.exports = Coupon;