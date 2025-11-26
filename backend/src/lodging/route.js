const express = require("express");
const router = express.Router();
const controller = require("./controller");

router.get("/", controller.getLodgings);
router.get("/:id", controller.getLodgingDetail);

module.exports = router;