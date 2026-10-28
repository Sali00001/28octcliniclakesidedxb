const fs = require("node:fs");
const express = require("express");
const path = require("path");
const { randomBytes } = require("node:crypto");
const session = require("express-session");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || (
  isProduction ? null : randomBytes(32).toString("hex")
);

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in .env or the environment.");
}

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is unset; using a temporary development-only secret.");
}

const authRouter = require("./routes/auth");
const bookingRouter = require("./routes/booking");
const myAppointmentsRouter = require("./routes/myAppointments");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction
  }
}));
app.use((request, response, next) => {
  response.locals.currentUser = request.session.user || null;
  next();
});

app.use(authRouter);
app.use("/booking", bookingRouter);
app.use("/my-appointments", myAppointmentsRouter);

app.get("/", (_request, response) => {
  response.render("index", {
    clinicName: "Lakeside Medical Clinic",
    area: "JLT, Dubai",
    tagline: "Expert care, close to home",
    address: "Cluster X, JLT, Dubai",
    phone: "Phone number to be added"
  });
});

app.listen(port, () => {
  console.log(`Lakeside Medical Clinic website is running at http://localhost:${port}`);
});
