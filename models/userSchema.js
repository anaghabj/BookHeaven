
const mongoose = require("mongoose");

const {Schema} = mongoose;

const userSchema = new Schema({
    name:{
        type:String,
        required :true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
        unique:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
       unique:true
        
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    // cart:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Cart"
    // }],

    cart: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
      }],
      
    wallet:{
        type:Number,
        default:0
    },
    wishlist:[{
        type:Schema.Types.ObjectId,
        ref:"wishlist"


    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"

    }],
    cretedOn:{
        type:Date,
        default:Date.now
    },
    referalCode:{
       type:String,
       //required:true
    },
    redeemed:{
       type:Boolean,
       //required:true
    },
    redeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User",
       // required:true

    }],
    searchHistory:[{
        category:{
            
                type:Schema.Types.ObjectId,
                ref:"Category"
            },
            searchOn:{
                type:Date,
                default:Date.now
            
        }

    }]



})

const User = mongoose.model("User",userSchema);

module.exports=User;