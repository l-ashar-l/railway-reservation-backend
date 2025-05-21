const { pool } = require("../database/db");
const constants = require("../config/constants");

const { TOTAL_BERTHS, RAC_CAPACITY, WL_CAPACITY } = constants;

class TicketService {
  static getInstance() {
    if (!TicketService.instance) {
      TicketService.instance = new TicketService();
    }
    return TicketService.instance;
  }

  bookTicket = async ({ name, age, gender, hasChild }) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const passRes = await client.query(
        `INSERT INTO passengers(name, age, gender, has_child) VALUES($1,$2,$3,$4) RETURNING id`,
        [name, age, gender, hasChild]
      );
      const passengerId = passRes.rows[0].id;

      if (age < 5) {
        const ticketRes = await client.query(
          `INSERT INTO tickets(passenger_id, status) VALUES($1, 'CONFIRMED') RETURNING id, status`,
          [passengerId]
        );
        await client.query("COMMIT");
        return ticketRes.rows[0];
      }

      await client.query("LOCK TABLE tickets IN SHARE ROW EXCLUSIVE MODE");

      const countsRes = await client.query(
        `SELECT
           SUM((status='CONFIRMED')::int) AS confirmed_count,
           SUM((status='RAC')::int)       AS rac_count,
           SUM((status='WAITING')::int)   AS wl_count
         FROM tickets`
      );
      const { confirmed_count, rac_count, wl_count } = countsRes.rows[0];

      let status = null;
      let berthType = "UPPER";
      if (confirmed_count < TOTAL_BERTHS) {
        status = "CONFIRMED";
        if (age >= 60 || (gender === "female" && hasChild)) {
          berthType = "LOWER";
        }
      } else if (rac_count < RAC_CAPACITY) {
        status = "RAC";
        berthType = "SIDE_LOWER";
      } else if (wl_count < WL_CAPACITY) {
        status = "WAITING";
      } else {
        throw new Error("No tickets available");
      }

      const ticketRes = await client.query(
        `INSERT INTO tickets(passenger_id, status) VALUES($1,$2) RETURNING id, status`,
        [passengerId, status]
      );
      const ticketId = ticketRes.rows[0].id;

      if (status !== "WAITING") {
        await client.query(
          `INSERT INTO berth_allocations(ticket_id, berth_type) VALUES($1,$2)`,
          [ticketId, berthType]
        );
      }

      await client.query("COMMIT");
      return ticketRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  cancelTicket = async (ticketId) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
  
      const tRes = await client.query(
        `SELECT status FROM tickets WHERE id=$1 FOR UPDATE`,
        [ticketId]
      );
  
      if (!tRes.rowCount || tRes.rows[0].status === "CANCELLED") {
        throw new Error("Ticket not found or already cancelled");
      }
  
      const prevStatus = tRes.rows[0].status;
  
      await client.query(`UPDATE tickets SET status='CANCELLED' WHERE id=$1`, [ticketId]);
      await client.query(`DELETE FROM berth_allocations WHERE ticket_id=$1`, [ticketId]);
  
      if (prevStatus === "CONFIRMED") {
        const nextRacRes = await client.query(
          `SELECT id FROM tickets WHERE status='RAC' ORDER BY created_at LIMIT 1 FOR UPDATE`
        );
  
        if (nextRacRes.rowCount) {
          const racId = nextRacRes.rows[0].id;
  
          await client.query(
            `UPDATE tickets SET status='CONFIRMED' WHERE id=$1`,
            [racId]
          );
  
          await client.query(
            `UPDATE berth_allocations SET berth_type='LOWER' WHERE ticket_id=$1`,
            [racId]
          );
  
          const nextWlRes = await client.query(
            `SELECT id FROM tickets WHERE status='WAITING' ORDER BY created_at LIMIT 1 FOR UPDATE`
          );
  
          if (nextWlRes.rowCount) {
            const wlId = nextWlRes.rows[0].id;
  
            await client.query(
              `UPDATE tickets SET status='RAC' WHERE id=$1`,
              [wlId]
            );
  
            await client.query(
              `INSERT INTO berth_allocations(ticket_id, berth_type) VALUES($1, 'SIDE_LOWER')`,
              [wlId]
            );
          }
        }
      } else if (prevStatus === "RAC") {
        const nextWlRes = await client.query(
          `SELECT id FROM tickets WHERE status='WAITING' ORDER BY created_at LIMIT 1 FOR UPDATE`
        );
  
        if (nextWlRes.rowCount) {
          const wlId = nextWlRes.rows[0].id;
  
          await client.query(
            `UPDATE tickets SET status='RAC' WHERE id=$1`,
            [wlId]
          );
  
          await client.query(
            `INSERT INTO berth_allocations(ticket_id, berth_type) VALUES($1, 'SIDE_LOWER')`,
            [wlId]
          );
        }
      }
  
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  
  listBooked = async () => {
    const res = await pool.query(
      `SELECT t.id AS ticket_id, t.status, p.*, b.berth_type
       FROM tickets t
       JOIN passengers p ON p.id=t.passenger_id
       LEFT JOIN berth_allocations b ON b.ticket_id=t.id
       WHERE t.status NOT IN ('CANCELLED')
       ORDER BY t.created_at`
    );
    return res.rows;
  }

  listAvailable = async () => {
    const countsRes = await pool.query(
      `SELECT
         SUM((t.status='CONFIRMED' AND p.age >= 5)::int) AS confirmed_count,
         SUM((t.status='RAC')::int)                                AS rac_count,
         SUM((t.status='WAITING')::int)                            AS wl_count
       FROM tickets t
       JOIN passengers p ON p.id = t.passenger_id`
    );
    const { confirmed_count, rac_count, wl_count } = countsRes.rows[0];
    return {
      confirmSeatsLeft: TOTAL_BERTHS - confirmed_count,
      racLeft: RAC_CAPACITY - rac_count,
      waitingLeft: WL_CAPACITY - wl_count,
    };
  }
}

module.exports = TicketService.getInstance();
