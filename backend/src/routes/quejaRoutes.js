const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/quejaController");

router.post("/", ctrl.create);
router.get("/", auth, role("admin"), ctrl.getAll);
router.patch("/:id/estado", auth, role("admin"), ctrl.updateEstado);

module.exports = router;
