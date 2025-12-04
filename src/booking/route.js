const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../common/authMiddleware");

// POST /api/bookings
router.post("/", verifyToken, controller.createBooking);

// GET /api/bookings/me
router.get("/me", verifyToken, controller.getMyBookings);

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", verifyToken, controller.cancelBooking);

module.exports = router;