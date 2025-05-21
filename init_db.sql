CREATE TABLE IF NOT EXISTS passengers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male','female','other')),
  has_child BOOLEAN DEFAULT FALSE
);

CREATE TYPE ticket_status AS ENUM ('CONFIRMED','RAC','WAITING','CANCELLED');

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  passenger_id INT REFERENCES passengers(id) ON DELETE CASCADE,
  status ticket_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE berth_type AS ENUM ('LOWER','UPPER','SIDE_LOWER');

CREATE TABLE IF NOT EXISTS berth_allocations (
  id SERIAL PRIMARY KEY,
  ticket_id INT UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
  berth_type berth_type
);

CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at);
