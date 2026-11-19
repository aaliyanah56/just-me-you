(() => {
  const yearElement = document.querySelector("#yr");
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  const toast = document.querySelector("#toast");
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    toast.style.display = "block";
    window.setTimeout(() => {
      toast.classList.remove("show");
      toast.style.display = "none";
    }, 4500);
  };

  document.querySelectorAll(".js-demo-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast(form.dataset.message || "This form is a preview and is not connected yet.");
      form.reset();
    });
  });

  // The public enquiry form opens the visitor's email application with a prefilled message.
  const enquiryForm = document.getElementById("cf");
  if (enquiryForm) {
    enquiryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const fields = enquiryForm.querySelectorAll("input, select, textarea");
      const [name, email, enquiryType, phone, message] = fields;
      const subject = encodeURIComponent(`URWA enquiry: ${enquiryType.value}`);
      const body = encodeURIComponent(
        `Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\nPhone/WhatsApp: ${phone.value.trim() || "Not provided"}\nEnquiry: ${enquiryType.value}\n\nMessage:\n${message.value.trim()}`
      );
      window.location.href = `mailto:urwatulwuthqa@gmail.com?subject=${subject}&body=${body}`;
      showToast("Your email application should open with your enquiry ready to send. Please send it there.");
    });
  }

  // Homepage monthly calendar beside “Never miss a session”.
  const calendarGrid = document.getElementById("cg");
  const monthLabel = document.getElementById("ml");
  const previousMonth = document.getElementById("pm");
  const nextMonth = document.getElementById("nm");

  if (!calendarGrid || !monthLabel || !previousMonth || !nextMonth) return;

  let displayedMonth = new Date();
  displayedMonth.setDate(1);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function renderCalendar() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    monthLabel.textContent = new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric"
    }).format(displayedMonth);

    calendarGrid.replaceChildren();

    weekdays.forEach((day) => {
      const heading = document.createElement("span");
      heading.className = "calendar-weekday";
      heading.textContent = day;
      heading.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(heading);
    });

    // Convert Sunday-first JavaScript dates to a Monday-first calendar.
    const firstDay = new Date(year, month, 1).getDay();
    const startingOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startingOffset; i += 1) {
      const emptyCell = document.createElement("span");
      emptyCell.className = "calendar-empty";
      emptyCell.setAttribute("aria-hidden", "true");
      calendarGrid.appendChild(emptyCell);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement("span");
      const isToday =
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate();

      cell.className = isToday ? "calendar-day today" : "calendar-day";
      cell.textContent = String(day);

      if (isToday) {
        cell.setAttribute("aria-current", "date");
        cell.setAttribute("aria-label", `Today, ${day}`);
      }

      calendarGrid.appendChild(cell);
    }
  }

  previousMonth.addEventListener("click", () => {
    displayedMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() - 1,
      1
    );
    renderCalendar();
  });

  nextMonth.addEventListener("click", () => {
    displayedMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 1,
      1
    );
    renderCalendar();
  });

  renderCalendar();
})();