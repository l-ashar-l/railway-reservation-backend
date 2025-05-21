const express = require("express");

const {
    validateBookTicket,
    validateCancelTicket,
    handleValidationErrors,
} = require('./validation/ticketValidations');
const TicketController = require("../controllers/ticketController");

const router = express.Router();

router.post("/book", validateBookTicket, handleValidationErrors, TicketController.book);

router.put("/cancel/:id", validateCancelTicket, handleValidationErrors, TicketController.cancel);

router.get("/booked", TicketController.booked);

router.get("/available", TicketController.available);

module.exports = router;
