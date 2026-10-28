const express = require("express");

const router = express.Router();

const specialties = {
  gp: { label: "General Physician", doctor: "Dr. Sara Ahmed" },
  ent: { label: "ENT", doctor: "Dr. Omar Khan" },
  dentist: { label: "Dentist", doctor: "Dr. Lina Haddad" },
  cardiologist: { label: "Cardiologist", doctor: "Dr. Raj Mehta" }
};

const timeSlots = Array.from({ length: 24 }, (_value, index) => {
  const totalMinutes = 9 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderBooking(request, response, options = {}) {
  const specialtyValue = options.values && options.values.specialty;
  const specialty = specialties[specialtyValue] ? specialtyValue : "";
  const userEmail = request.session.user ? request.session.user.email : "";
  response.status(options.status || 200).render("booking", {
    clinicName: "Lakeside Medical Clinic",
    area: "JLT, Dubai",
    confirmation: false,
    specialties,
    timeSlots,
    minimumDate: todayString(),
    doctor: specialty ? specialties[specialty].doctor : "",
    errors: options.errors || [],
    values: Object.assign({}, options.values, {
      email: userEmail || (options.values && options.values.email) || "",
      specialty
    })
  });
}

router.get("/", (request, response) => {
  renderBooking(request, response);
});

router.post("/", (request, response) => {
  const body = request.body && typeof request.body === "object" ? request.body : {};
  const values = {
    specialty: typeof body.specialty === "string" ? body.specialty : "",
    doctor: typeof body.doctor === "string" ? body.doctor.trim() : "",
    date: typeof body.date === "string" ? body.date.trim() : "",
    time: typeof body.time === "string" ? body.time : "",
    patientName: typeof body.patientName === "string" ? body.patientName.trim() : "",
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    email: request.session.user
      ? request.session.user.email
      : typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  };
  const errors = [];

  if (!specialties[values.specialty]) {
    errors.push("Choose a valid specialty.");
  } else if (values.doctor !== specialties[values.specialty].doctor) {
    errors.push("Choose the doctor listed for your selected specialty.");
  }

  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(values.date);
  const parsedDate = dateParts
    ? new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])))
    : null;
  if (!parsedDate || Number(dateParts[1]) < 1000 || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== values.date) {
    errors.push("Enter a valid appointment date.");
  } else {
    if (values.date < todayString()) {
      errors.push("Choose today or a future date.");
    }
    if (parsedDate.getUTCDay() === 0) {
      errors.push("The clinic is closed on Sundays. Choose another date.");
    }
  }

  if (!timeSlots.includes(values.time)) {
    errors.push("Choose an available time between 9:00am and 8:30pm.");
  }

  if (values.patientName.length < 2 || values.patientName.length > 100) {
    errors.push("Enter a patient name between 2 and 100 characters.");
  }
  const phoneDigits = values.phone.replace(/\D/g, "");
  if (!/^[+\d().\s-]+$/.test(values.phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.push("Enter a valid phone number with 7 to 15 digits.");
  }
  if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.push("Enter a valid email address.");
  }

  if (errors.length) {
    return renderBooking(request, response, { status: 400, values, errors });
  }

  const summary = {
    specialty: specialties[values.specialty].label,
    doctor: values.doctor,
    appointmentDateTime: `${values.date}T${values.time}:00`,
    patientName: values.patientName,
    patientPhone: values.phone,
    patientEmail: values.email
  };

  return response.render("booking", {
    clinicName: "Lakeside Medical Clinic",
    area: "JLT, Dubai",
    confirmation: true,
    summary
  });
});

module.exports = router;
