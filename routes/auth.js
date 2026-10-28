const bcrypt = require("bcryptjs");
const express = require("express");
const appointmentService = require("../services/appointmentService");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRounds = 12;

function renderAuth(response, options) {
  response.status(options.status || 200).render("auth", {
    clinicName: "Lakeside Medical Clinic",
    area: "JLT, Dubai",
    isRegister: options.isRegister,
    error: options.error || "",
    email: options.email || ""
  });
}

function regenerateSession(request, user) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      request.session.user = { id: user.id, email: user.email };
      request.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }
        resolve();
      });
    });
  });
}

function authHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

router.get("/register", (request, response) => {
  if (request.session.user) {
    return response.redirect("/my-appointments");
  }
  return renderAuth(response, { isRegister: true });
});

router.post("/register", authHandler(async (request, response) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  const passwordConfirmation = typeof request.body.passwordConfirmation === "string"
    ? request.body.passwordConfirmation
    : "";

  if (email.length > 254 || !emailPattern.test(email)) {
    return renderAuth(response, {
      isRegister: true,
      status: 400,
      email,
      error: "Enter a valid email address."
    });
  }
  if (password.length < 10 || Buffer.byteLength(password, "utf8") > 72) {
    return renderAuth(response, {
      isRegister: true,
      status: 400,
      email,
      error: "Use a password between 10 and 72 bytes."
    });
  }
  if (password !== passwordConfirmation) {
    return renderAuth(response, {
      isRegister: true,
      status: 400,
      email,
      error: "The passwords do not match."
    });
  }

  const passwordHash = await bcrypt.hash(password, passwordRounds);
  const user = appointmentService.createUser(email, passwordHash);
  if (!user) {
    return renderAuth(response, {
      isRegister: true,
      status: 409,
      email,
      error: "An account with that email already exists. Please log in."
    });
  }

  await regenerateSession(request, user);
  return response.redirect("/my-appointments");
}));

router.get("/login", (request, response) => {
  if (request.session.user) {
    return response.redirect("/my-appointments");
  }
  return renderAuth(response, { isRegister: false });
});

router.post("/login", authHandler(async (request, response) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  const user = email.length <= 254 && emailPattern.test(email)
    ? appointmentService.findUserByEmail(email)
    : null;

  if (!user || Buffer.byteLength(password, "utf8") > 72 || !await bcrypt.compare(password, user.passwordHash)) {
    return renderAuth(response, {
      isRegister: false,
      status: 401,
      email,
      error: "Email or password is incorrect."
    });
  }

  await regenerateSession(request, user);
  return response.redirect("/my-appointments");
}));

router.post("/logout", (request, response, next) => {
  if (!request.session) {
    return response.redirect("/");
  }
  request.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    response.clearCookie("connect.sid", { path: "/" });
    return response.redirect("/");
  });
});

module.exports = router;