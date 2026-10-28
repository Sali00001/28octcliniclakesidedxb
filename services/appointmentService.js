const db = require("../data/db");

const insertBooking = db.prepare(`
  INSERT INTO appointments (
    specialty,
    doctor,
    appointmentDateTime,
    patientName,
    patientPhone,
    patientEmail
  ) VALUES (?, ?, ?, ?, ?, ?)
`);
const getBookingById = db.prepare("SELECT * FROM appointments WHERE id = ?");
const bookingsByEmail = db.prepare(`
  SELECT * FROM appointments
  WHERE patientEmail = ? COLLATE NOCASE
  ORDER BY createdAt DESC, id DESC
`);
const bookingsByDate = db.prepare(`
  SELECT * FROM appointments
  WHERE appointmentDateTime >= ? AND appointmentDateTime < ?
  ORDER BY appointmentDateTime
`);
const changeStatus = db.prepare(`
  UPDATE appointments
  SET status = ?
  WHERE id = ? AND patientEmail = ? AND status = 'Booked'
`);
const insertUser = db.prepare(`
  INSERT INTO users (email, passwordHash)
  VALUES (?, ?)
  ON CONFLICT(email) DO NOTHING
`);
const getUserByEmail = db.prepare(`
  SELECT id, email, passwordHash, createdAt
  FROM users
  WHERE email = ?
`);
const getUserById = db.prepare(`
  SELECT id, email, createdAt
  FROM users
  WHERE id = ?
`);

function createBooking(booking) {
  const result = insertBooking.run(
    booking.specialty,
    booking.doctor,
    booking.appointmentDateTime,
    booking.patientName,
    booking.patientPhone,
    booking.patientEmail
  );
  return getBookingById.get(Number(result.lastInsertRowid));
}

function getBookingsByEmail(email) {
  return bookingsByEmail.all(email);
}

function getBookingsByDate(date) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(nextDate.getTime())) {
    throw new TypeError("A valid appointment date is required.");
  }
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return bookingsByDate.all(
    `${date}T00:00:00`,
    `${nextDate.toISOString().slice(0, 10)}T00:00:00`
  );
}

function updateStatus(id, status, patientEmail) {
  if (status !== "Cancelled") {
    throw new TypeError("Only appointment cancellation is supported.");
  }
  const result = changeStatus.run(status, id, patientEmail);
  return result.changes ? getBookingById.get(id) : null;
}

function createUser(email, passwordHash) {
  const result = insertUser.run(email, passwordHash);
  return result.changes ? getUserById.get(Number(result.lastInsertRowid)) : null;
}

function findUserByEmail(email) {
  return getUserByEmail.get(email) || null;
}

module.exports = {
  createBooking,
  getBookingsByEmail,
  getBookingsByDate,
  updateStatus,
  createUser,
  findUserByEmail
};
