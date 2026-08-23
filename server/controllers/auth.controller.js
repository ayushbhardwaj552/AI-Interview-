import User from "../models/user.models.js";
import genToken from "../config/token.js";

export const googleAuth = async(req ,res)=>{
    try{
      const {name, email} = req.body;
      let user = await User.findOne({email});

      if(!user){
        user = await User.create({name, email});
      }

      // Admin bootstrap: if ADMIN_EMAIL env var matches this login email,
      // promote the account to admin exactly once. The env var is only needed
      // for the first-time promotion — subsequent logins use the DB role.
      if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL && user.role !== "admin") {
        user.role = "admin";
        await user.save();
      }

      // Prevent disabled users from obtaining a fresh session
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account has been disabled. Please contact support.",
          success: false
        });
      }
    
    let token = await genToken(user._id);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7*24*60*60*1000
    })

    return res.json({message:"Login Successfull", user, sucess:true});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: `Google Auth error ${err}`, success:false});
    }
}

export const logout = async(req, res)=>{
    try{
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });
        return res.status(200).json({message:"Logout Successfull", success:true});
    }
    catch(err){
         return res.status(500).json({message: `Log out error ${err}`, success:false});
    }
}