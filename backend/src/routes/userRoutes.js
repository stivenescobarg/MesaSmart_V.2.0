const express = require("express");
const router = express.Router();

const {createUser} = require("../controllers/userController");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

router.post("/create",auth,role("admin"),createUser);

module.exports = router;