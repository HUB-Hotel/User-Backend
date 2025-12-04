const express = require("express");
const router = express.Router();
const controller = require("./controller");

router.get("/:lodgingId", controller.getRooms);

module.exports = router;