const express = require("express");
const appointmentService = require("../services/appointmentService");

const router = express.Router();

function requireLogin(request, response, next) {
  if (!request.session.user) {
    return response.redirect("/login");
  }
  return next();
}

router.get("/", requireLogin, (request, response) => {
  response.set("Cache-Control", "no-store");
  response.render("my-appointments", {
    clinicName: "Lakeside Medical Clinic",
    area: "JLT, Dubai",
    appointments: appointmentService.getBookingsByEmail(request.session.user.email),
    notice: request.query.cancelled === "1"
      ? "Your appointment was cancelled."
      : request.query.error === "not-found"
        ? "That appointment could not be cancelled."
        : ""
  });
});

router.post("/:id/cancel", requireLogin, (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.redirect("/my-appointments?error=not-found");
  }

  const appointment = appointmentService.updateStatus(
    id,
    "Cancelled",
    request.session.user.email
  );
  return response.redirect(
    appointment ? "/my-appointments?cancelled=1" : "/my-appointments?error=not-found"
  );
});

module.exports = router;