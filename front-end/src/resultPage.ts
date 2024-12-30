import { handleReport } from './reportHandeler.ts';

interface UserData {
    surname: string;
    lastname: string;
    hobbies: string[];
}

document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.querySelector<HTMLDivElement>("#results");
    const emailList = document.querySelector<HTMLUListElement>('#email-list');
    const emailContent = document.querySelector<HTMLDivElement>('#email-content');

    if (!resultsContainer || !emailList || !emailContent) {
        console.error("Required elements not found");
        return;
    }

    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.textContent = 'Loading emails...';
    document.body.appendChild(loadingOverlay);

    const urlParams = new URLSearchParams(window.location.search);
    const userDataStr = urlParams.get('userData');
    
    if (!userDataStr) {
        resultsContainer.innerHTML = '<p class="error">No user data found!</p>';
        return;
    }

    const userData: UserData = JSON.parse(decodeURIComponent(userDataStr));
    const name = `${userData.surname} ${userData.lastname}`;
    
    // Get 3 random hobbies
    const selectedHobbies = [...userData.hobbies]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    console.log('Selected hobbies:', selectedHobbies); // Debug log

    // Clear previous content
    emailList.innerHTML = '';
    emailContent.innerHTML = '<p>Select email...</p>';

    const senders = [
        { id: 1, name: 'Urban Haven', email: 'urban.haven@hobbyhub.com' },
        { id: 2, name: 'Urban Haven', email: 'sarah.w@hobbyhub.com' },
        { id: 3, name: 'Mike Johnson', email: 'mike.j@hobbyhub.com' },
        { id: 4, name: 'Urban Haven', email: 'urban.haven@emal.com' }
    ];

    const timestamps = [
        { id: 1, time: '10:30 AM' },
        { id: 2, time: '02:45 PM' },
        { id: 3, time: '08:15 PM' },
    ];

    let emailIdCounter = 1; // Add an email ID counter

    const reportedEmails = [];

    // Process emails sequentially
    async function processHobby(hobby: string) {
        try {
            console.log(`Fetching for hobby: ${hobby}`);
            const response = await fetch(
                `http://localhost:3000/email?name=${encodeURIComponent(name)}&hobby=${encodeURIComponent(hobby)}`
            );
            const text = await response.text();
            console.log(`Received response for ${hobby}:`, text);

            const emailId = emailIdCounter++;
            const randomSender = senders[Math.floor(Math.random() * senders.length)];
            const timestampObj = timestamps[Math.floor(Math.random() * timestamps.length)];

            const li = document.createElement('li');
            li.className = 'email-item';
            li.setAttribute('data-email-id', emailId.toString());
            li.setAttribute('data-sender-id', randomSender.id.toString());
            li.innerHTML = `
                <div class="email-header">
                    <span class="sender">${randomSender.name} <${randomSender.email}></span>
                    <span class="time">${timestampObj.time}</span>
                </div>
                <div class="subject">RE: ${hobby} Recommendations</div>
                <div class="preview">Here are some great recommendations for ${hobby}...</div>
            `;
            li.addEventListener('click', () => {
                document.querySelectorAll('.email-item').forEach(item => 
                    item.classList.remove('active')
                );
                li.classList.add('active');
                emailContent.innerHTML = `
                    <div class="email-full-header">
                        <h2>RE: ${hobby} Recommendations</h2>
                        <div class="sender-info">
                            From: ${randomSender.email}
                            <br>
                            Sent: ${timestampObj.time}
                        </div>
                    </div>
                    <p>${text}</p>
                    <button id="report-button">Report</button>
                `;

                const reportButton = document.getElementById('report-button');

                // Create modal overlay
                const modalOverlay = document.createElement('div');
                modalOverlay.id = 'modal-overlay';
                modalOverlay.style.display = 'none';
                modalOverlay.innerHTML = `
                    <div id="report-modal">
                        <form>
                            <h3>Select the types of scams:</h3>
                            <label><input type="checkbox" name="scamType" value="Message"> Message</label>
                            <label><input type="checkbox" name="scamType" value="Wrong time"> Wrong time</label>
                            <label><input type="checkbox" name="scamType" value="Wrong sender name"> Wrong sender name</label>
                            <label><input type="checkbox" name="scamType" value="Wrong domain"> Wrong domain</label>
                            <input type="hidden" name="emailId" value="${emailId}">
                            <input type="hidden" name="timeId" value="${timestampObj.id}">
                            <div class="modal-buttons">
                                <button type="button" id="submit-report">Submit</button>
                                <button type="button" id="close-modal">Cancel</button>
                            </div>
                        </form>
                    </div>
                `;
                document.body.appendChild(modalOverlay);

                reportButton?.addEventListener('click', () => {
                    modalOverlay.style.display = 'block'; // Show modal
                });

                modalOverlay.querySelector('#submit-report')?.addEventListener('click', () => {
                    const selectedReasons = Array.from(modalOverlay.querySelectorAll('input[name="scamType"]:checked')).map(input => input.value);
                    if (selectedReasons.length === 0) {
                        alert('Please select at least one reason.');
                        return;
                    }
                    reportedEmails.push({
                        emailId,
                        senderId: randomSender.id,
                        emailTimeId: timestampObj.id,
                        senderInfo: { id: randomSender.id },
                        reasons: selectedReasons
                    });
                    li.classList.add('reported'); // Mark email as reported
                    modalOverlay.style.display = 'none';
                    
                    // Add red line through the email in the list
                    const emailListItem = document.querySelector(`[data-email-id="${emailId}"]`);
                    if (emailListItem) {
                        emailListItem.classList.add('reported');
                    }
                });

                modalOverlay.querySelector('#close-modal')?.addEventListener('click', () => {
                    modalOverlay.style.display = 'none';
                });

                // Remove the form submission handler that prevents default
            });
            emailList.appendChild(li);
        } catch (error) {
            console.error(`Error fetching email for ${hobby}:`, error);
        }
    }

    // Add submit button to send all reported emails to report.html
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-reports';
    submitButton.textContent = 'Submit All Reports';
    document.body.appendChild(submitButton);

    submitButton.addEventListener('click', () => {
        // Create confirmation modal
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-overlay';
        modalOverlay.style.display = 'flex';

        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'confirmation-modal';
        confirmationModal.innerHTML = `
            <h3>Submit All Reports?</h3>
            <p>Are you sure you want to submit all your reports?</p>
            <div class="confirmation-buttons">
                <button class="confirm-button">Yes, Submit</button>
                <button class="cancel-button">Cancel</button>
            </div>
        `;

        modalOverlay.appendChild(confirmationModal);
        document.body.appendChild(modalOverlay);

        // Handle confirmation buttons
        const confirmButton = confirmationModal.querySelector('.confirm-button');
        const cancelButton = confirmationModal.querySelector('.cancel-button');

        confirmButton?.addEventListener('click', () => {
            const reportData = {
                timestamp: Date.now(),
                totalEmails: emailIdCounter - 1,
                reportedEmails,
                unreportedEmails: Array.from(document.querySelectorAll('.email-item:not(.active)')).map(item => parseInt(item.getAttribute('data-email-id') || '0'))
            };
            localStorage.setItem('reportData', JSON.stringify(reportData));
            window.location.href = 'report.html';
        });

        cancelButton?.addEventListener('click', () => {
            modalOverlay.remove();
        });
    });

    // Process hobbies one by one
    (async () => {
        for (const hobby of selectedHobbies) {
            await processHobby(hobby);
        }
        // Hide loading overlay after all emails are loaded
        loadingOverlay.style.display = 'none';
    })();
});