const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req,res)=>{

  const {email,password} = req.body;

  const user = await User.findOne({email});

  if(!user){
    return res.status(400).json({msg:"Usuario no existe"});
  }

  const validPassword = await bcrypt.compare(password,user.password);

  if(!validPassword){
    return res.status(400).json({msg:"Contraseña incorrecta"});
  }

  const token = jwt.sign(

    {id:user._id,role:user.role},
    process.env.JWT_SECRET,
    {expiresIn:"8h"}

  );

  res.json({

    token,
    role:user.role

  });

};