const TicketService = require("../services/ticketService");

class TicketController {
  constructor() {
    this.ticketService = TicketService;
  }

  static getInstance() {
    if (!TicketController.instance) {
      TicketController.instance = new TicketController();
    }
    return TicketController.instance;
  }

  book = async (req, res) => {
    console.log("ticket controller - book - start");
    try {
      const ticket = await this.ticketService.bookTicket(req.body);
      return res.status(201).json(ticket);
    } catch (err) {
      console.error(`ticket controller - book - error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    } finally {
      console.log("ticket controller - book - end");
    }
  }

  cancel = async (req, res) => {
    console.log("ticket controller - cancel - start");
    try {
      await this.ticketService.cancelTicket(parseInt(req.params.id, 10));
      return res.json({ message: "Cancelled" });
    } catch (err) {
      console.error(`ticket controller - cancel - error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    } finally {
      console.log("ticket controller - cancel - end");
    }
  }

  booked = async (req, res) => {
    console.log("ticket controller - booked - start");
    try {
      const data = await this.ticketService.listBooked();
      return res.json(data);
    } catch (err) {
      console.error(`ticket controller - booked - error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    } finally {
      console.log("ticket controller - booked - end");
    }
  }

  available = async (req, res) => {
    console.log("ticket controller - available - start");
    try {
      const data = await this.ticketService.listAvailable();
      return res.json(data);
    } catch (err) {
      console.error(`ticket controller - available - error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    } finally {
      console.log("ticket controller - available - end");
    }
  }
}

module.exports = TicketController.getInstance();
