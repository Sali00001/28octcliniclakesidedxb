(() => {
  const form = document.querySelector("[data-booking-form]");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll("[data-step]"));
  const progress = Array.from(form.querySelectorAll("[data-progress]"));
  const specialty = form.querySelector("#specialty");
  const doctor = form.querySelector("#doctor");
  const date = form.querySelector("#date");
  const previousButton = form.querySelector("[data-previous]");
  const nextButton = form.querySelector("[data-next]");
  const confirmButton = form.querySelector("[data-confirm]");
  let currentStep = 0;

  const doctors = {
    gp: "Dr. Sara Ahmed",
    ent: "Dr. Omar Khan",
    dentist: "Dr. Lina Haddad",
    cardiologist: "Dr. Raj Mehta"
  };
  const labels = {
    gp: "General Physician",
    ent: "ENT",
    dentist: "Dentist",
    cardiologist: "Cardiologist"
  };

  function localDateString() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  }

  function updateDoctor() {
    const name = doctors[specialty.value];
    doctor.replaceChildren(new Option(name || "Choose a specialty first", name || ""));
    doctor.disabled = !name;
  }

  function showStep(index) {
    currentStep = index;
    steps.forEach((step, stepIndex) => {
      step.hidden = stepIndex !== currentStep;
    });
    progress.forEach((item, stepIndex) => {
      item.classList.toggle("is-current", stepIndex === currentStep);
      item.classList.toggle("is-complete", stepIndex < currentStep);
    });
    previousButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    confirmButton.hidden = currentStep !== steps.length - 1;
  }

  function updateSummary() {
    form.querySelector("[data-summary-specialty]").textContent = labels[specialty.value] || "Not selected";
    form.querySelector("[data-summary-doctor]").textContent = doctor.value || "Not selected";
    const selectedDate = date.value;
    const selectedTime = form.querySelector("#time").value;
    form.querySelector("[data-summary-datetime]").textContent = selectedDate
      ? `${selectedDate}${selectedTime ? ` at ${selectedTime}` : ""}`
      : "Not selected";
    form.querySelector("[data-summary-patient]").textContent =
      form.querySelector("#patientName").value.trim() || "Not entered";
    form.querySelector("[data-summary-phone]").textContent =
      form.querySelector("#phone").value.trim() || "Not entered";
    form.querySelector("[data-summary-email]").textContent =
      form.querySelector("#email").value.trim() || "Not entered";
  }

  function validateDate() {
    if (date.value && new Date(`${date.value}T00:00:00`).getDay() === 0) {
      date.setCustomValidity("The clinic is closed on Sundays. Choose another date.");
    } else {
      date.setCustomValidity("");
    }
  }

  specialty.addEventListener("change", () => {
    updateDoctor();
    updateSummary();
  });
  date.addEventListener("change", () => {
    validateDate();
    updateSummary();
  });
  form.addEventListener("input", updateSummary);
  form.addEventListener("change", updateSummary);

  previousButton.addEventListener("click", () => showStep(currentStep - 1));
  nextButton.addEventListener("click", () => {
    const fields = Array.from(steps[currentStep].querySelectorAll("input, select"));
    const invalidField = fields.find((field) => !field.checkValidity());
    if (invalidField) {
      invalidField.reportValidity();
      return;
    }
    showStep(currentStep + 1);
  });

  date.min = localDateString();
  validateDate();
  updateDoctor();
  if (doctor.dataset.selectedDoctor) doctor.value = doctor.dataset.selectedDoctor;
  updateSummary();
  showStep(0);
})();
