const User = require("../models/userSchema");

const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
            }else{
                res.redirect('/login')
            }
        })
        .catch(error=>{
            console.log("Error in user auth middleware")
            res.status(500).send("Internal Server error")
        })
    }else{
        res.redirect('/login')
    }
}


const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })

    .catch(error=>{
        console.log("Error in adminAuth middleware")
            res.status(500).send("Internal Server Error")
        
    })
}






// const adminAuth = async (req, res, next) => {
//     try {
//         // Check if the current authenticated user is an admin
//         const user = await User.findOne({ _id: req.userId, isAdmin: true });
//         if (user) {
//             next(); // User is admin, proceed to the next middleware
//         } else {
//             res.redirect("/admin/login"); // Redirect to admin login if not authorized
//         }
//     } catch (error) {
//         console.error("Error in adminAuth middleware:", error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };





module.exports={
    userAuth,
    adminAuth
}