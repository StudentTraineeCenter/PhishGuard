const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <h1>User Information</h1>
    <form id="userForm">
      <label for="surname">Surname:</label>
      <input type="text" id="surname" name="surname" required>

      <label for="lastname">Lastname:</label>
      <input type="text" id="lastname" name="lastname" required>

      <label for="hobbies">Hobbies:</label>
      <div class="hobbies-wrapper" id="hobbiesWrapper">
        <input type="text" id="hobbyInput" placeholder="Type and press enter to add" />
        <div class="hobbies-list"></div>
      </div>

      <button type="submit">Submit</button>
    </form>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .invalid {
      border: 2px solid red !important;
    }
    /* Loading styles */
    .loading {
      font-size: 1.2em;
      color: #555;
    }
  `;
  document.head.appendChild(style);
}

const form = document.getElementById("userForm") as HTMLFormElement | null;
const hobbiesWrapper = document.getElementById("hobbiesWrapper") as HTMLDivElement | null;
const hobbyInput = document.getElementById("hobbyInput") as HTMLInputElement | null;

let hobbies: string[] = [];

function updateHobbiesDisplay() {
  const hobbiesList = document.querySelector(".hobbies-list") as HTMLDivElement;

  hobbiesList.innerHTML = "";

  hobbies.forEach((hobby, index) => {
    const bubble = document.createElement("div");
    bubble.className = "hobby-tag";
    bubble.innerHTML = `${hobby}<span class="close" data-index="${index}">&times;</span>`;
    hobbiesList.appendChild(bubble);
  });

  hobbiesList.querySelectorAll(".close").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const index = parseInt(target.getAttribute("data-index") || "-1", 10);
      if (index > -1) {
        hobbies.splice(index, 1);
        updateHobbiesDisplay();
      }
    });
  });
}

if (hobbyInput && hobbiesWrapper) {
  hobbyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const hobby = hobbyInput.value.trim();
      if (hobby && !hobbies.includes(hobby)) {
        hobbies.push(hobby);
        hobbyInput.value = "";
        updateHobbiesDisplay();
      }
    }
  });
}

if (form) {
  form.addEventListener("submit", async function (event: Event) {
    event.preventDefault();

    const formData = {
      surname: (document.getElementById("surname") as HTMLInputElement).value,
      lastname: (document.getElementById("lastname") as HTMLInputElement).value,
      hobbies: hobbies
    };

    const encodedData = encodeURIComponent(JSON.stringify(formData));
    const redirectUrl = '/result.html?userData=' + encodedData;
    console.log('Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
  });
}
