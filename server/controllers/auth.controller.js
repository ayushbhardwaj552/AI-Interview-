import User from "../models/user.models.js";
import genToken from "../config/token.js";

export const googleAuth = async(req ,res)=>{
    try{
      const {name, email} = req.body;
      let user = await User.findOne({email});

      if(!user){
        user = await User.create({name, email});

      }
    
    let token = await genToken(user._id);
    res.cookie("token", token, {
        httpOnly:true,
        secure:false,
        sameSite:"lax",
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
        res.clearCookie("token");
        return res.status(200).json({message:"Logout Successfull", success:true});
    }
    catch(err){
         return res.status(500).json({message: `Log out error ${err}`, success:false});
 
    }
}