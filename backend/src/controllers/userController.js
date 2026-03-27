const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.createUser = async(req,res)=>{

  const {name,email,password,role} = req.body;

  const hashedPassword = await bcrypt.hash(password,10);

  const user = new User({

    name,
    email,
    password:hashedPassword,
    role

  });

  await user.save();

  res.json({msg:"Usuario creado"});

};