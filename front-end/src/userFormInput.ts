interface UserFormData {
    surname: string;
    lastname: string;
    hobbies: string[];
}

class HobbiesManager {
    private hobbies: string[] = [];
    private hobbyInput: HTMLInputElement;
    private hobbiesList: HTMLDivElement;

    constructor(wrapper: HTMLDivElement) {
        this.hobbyInput = wrapper.querySelector('#hobbyInput') as HTMLInputElement;
        this.hobbiesList = wrapper.querySelector('.hobbies-list') as HTMLDivElement;
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        this.hobbyInput.addEventListener('keydown', (e) => this.handleHobbyInput(e));
    }

    private handleHobbyInput(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            const hobby = this.hobbyInput.value.trim();
            if (hobby && !this.hobbies.includes(hobby)) {
                this.addHobby(hobby);
                this.hobbyInput.value = '';
            }
        }
    }

    private addHobby(hobby: string): void {
        this.hobbies.push(hobby);
        this.updateDisplay();
    }

    private updateDisplay(): void {
        this.hobbiesList.innerHTML = '';
        this.hobbies.forEach((hobby, index) => {
            const bubble = document.createElement('div');
            bubble.className = 'hobby-tag';
            bubble.innerHTML = `${hobby}<span class="close" data-index="${index}">&times;</span>`;
            bubble.querySelector('.close')?.addEventListener('click', () => {
                this.removeHobby(index);
            });
            this.hobbiesList.appendChild(bubble);
        });
    }

    private removeHobby(index: number): void {
        this.hobbies.splice(index, 1);
        this.updateDisplay();
    }

    getHobbies(): string[] {
        return [...this.hobbies];
    }
}

class UserForm {
    private form: HTMLFormElement;
    private hobbiesManager: HobbiesManager;

    constructor(appElement: HTMLDivElement) {
        this.initializeUI(appElement);
        this.form = document.getElementById('userForm') as HTMLFormElement;
        this.hobbiesManager = new HobbiesManager(
            document.getElementById('hobbiesWrapper') as HTMLDivElement
        );
        this.initializeEventListeners();
    }

    private initializeUI(appElement: HTMLDivElement): void {
        appElement.innerHTML = `
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

        this.addStyles();
    }

    private addStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .invalid { border: 2px solid red !important; }
            .loading { font-size: 1.2em; color: #555; }
        `;
        document.head.appendChild(style);
    }

    private initializeEventListeners(): void {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    private handleSubmit(event: Event): void {
        event.preventDefault();
        
        // Validate that at least one hobby has been added
        const hobbies = this.hobbiesManager.getHobbies();
        if (hobbies.length === 0) {
            const hobbyInput = document.getElementById('hobbyInput') as HTMLInputElement;
            hobbyInput.classList.add('invalid');
            hobbyInput.focus();
            return;
        } else {
            const hobbyInput = document.getElementById('hobbyInput') as HTMLInputElement;
            hobbyInput.classList.remove('invalid');
        }
        
        const formData: UserFormData = {
            surname: (document.getElementById('surname') as HTMLInputElement).value,
            lastname: (document.getElementById('lastname') as HTMLInputElement).value,
            hobbies: hobbies
        };

        this.redirectToResults(formData);
    }

    private redirectToResults(formData: UserFormData): void {
        const encodedData = encodeURIComponent(JSON.stringify(formData));
        const redirectUrl = '/result.html?userData=' + encodedData;
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const appElement = document.querySelector<HTMLDivElement>('#app');
    if (appElement) {
        new UserForm(appElement);
    } else {
        console.error('App element not found');
    }
});
