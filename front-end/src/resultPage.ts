import { ReportHandler, ResultAnalyzer, ExpectedReasonsCalculator } from './reportHandeler';

interface UserData {
    surname: string;
    lastname: string;
    hobbies: string[];
}

interface Sender {
    id: number;
    name: string;
    email: string;
}

interface TimeStamp {
    id: number;
    time: string;
}

interface EmailData {
    emailId: number;
    hobby: string;
    sender: Sender;
    timestamp: TimeStamp;
    content: string;
}

class EmailManager {
    private senders: Sender[] = [
        { id: 1, name: 'Urban Haven', email: 'urban.haven@onlineShop.com' },
        { id: 2, name: 'Urban Haven', email: 'sarah.w@onlineShop.com' },
        { id: 3, name: 'Mike Johnson', email: 'mike.j@onlineShop.com' },
        { id: 4, name: 'Urban Haven', email: 'urban.haven@emal.com' }
    ];

    private timestamps: TimeStamp[] = [
        { id: 1, time: '10:30 AM' },
        { id: 2, time: '02:45 PM' },
        { id: 3, time: '08:15 PM' },
    ];

    private emailIdCounter = 1;

    async fetchEmail(name: string, hobby: string): Promise<EmailData> {
        const response = await fetch(
            `http://localhost:3000/email?name=${encodeURIComponent(name)}&hobby=${encodeURIComponent(hobby)}`
        );
        const content = await response.text();
        
        return {
            emailId: this.emailIdCounter++,
            hobby,
            sender: this.getRandomSender(),
            timestamp: this.getRandomTimestamp(),
            content
        };
    }

    private getRandomSender(): Sender {
        return this.senders[Math.floor(Math.random() * this.senders.length)];
    }

    private getRandomTimestamp(): TimeStamp {
        return this.timestamps[Math.floor(Math.random() * this.timestamps.length)];
    }
}

class UIManager {
    private container: HTMLDivElement;
    private emailList: HTMLUListElement;
    private emailContent: HTMLDivElement;
    private loadingOverlay: HTMLDivElement;

    constructor() {
        this.container = document.querySelector("#results") as HTMLDivElement;
        this.emailList = document.querySelector('#email-list') as HTMLUListElement;
        this.emailContent = document.querySelector('#email-content') as HTMLDivElement;
        this.loadingOverlay = this.createLoadingOverlay();
    }

    private createLoadingOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Loading emails...</div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    createEmailListItem(emailData: EmailData): HTMLLIElement {
        const li = document.createElement('li');
        li.className = 'email-item';
        li.setAttribute('data-email-id', emailData.emailId.toString());
        li.setAttribute('data-sender-id', emailData.sender.id.toString());
        li.innerHTML = `
            <div class="email-header">
                <span class="sender">${emailData.sender.name} <${emailData.sender.email}></span>
                <span class="time">${emailData.timestamp.time}</span>
            </div>
            <div class="subject">RE: ${emailData.hobby} Recommendations</div>
            <div class="preview">Here are some great recommendations for ${emailData.hobby}...</div>
        `;
        return li;
    }

    updateEmailContent(emailData: EmailData): void {
        this.emailContent.innerHTML = `
            <div class="email-full-header">
                <h2>RE: ${emailData.hobby} Recommendations</h2>
                <div class="sender-info">
                    From: ${emailData.sender.email}
                    <br>
                    Sent: ${emailData.timestamp.time}
                </div>
            </div>
            <p>${emailData.content}</p>
            <button id="report-button">Report</button>
        `;
    }

    hideLoading(): void {
        this.loadingOverlay.style.display = 'none';
    }

    markEmailAsReported(emailId: number): void {
        const emailListItem = document.querySelector(`[data-email-id="${emailId}"]`);
        if (emailListItem) {
            emailListItem.classList.add('reported');
        }
    }
}

class ReportManager {
    private reportedEmails: any[] = [];

    createReportModal(emailData: EmailData): HTMLDivElement {
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-overlay';
        modalOverlay.style.display = 'none';
        modalOverlay.innerHTML = `
            <div id="report-modal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <form>
                    <h3>Select the types of scams:</h3>
                    <label><input type="checkbox" name="scamType" value="Message"> Message</label>
                    <label><input type="checkbox" name="scamType" value="Wrong time"> Wrong time</label>
                    <label><input type="checkbox" name="scamType" value="Wrong sender name"> Wrong sender name</label>
                    <label><input type="checkbox" name="scamType" value="Wrong domain"> Wrong domain</label>
                    <input type="hidden" name="emailId" value="${emailData.emailId}">
                    <input type="hidden" name="timeId" value="${emailData.timestamp.id}">
                    <div class="modal-buttons">
                        <button type="button" id="submit-report">Submit</button>
                        <button type="button" id="close-modal">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        return modalOverlay;
    }

    handleReport(emailData: EmailData, modalOverlay: HTMLDivElement, uiManager: UIManager): void {
        const reportButton = document.getElementById('report-button');
        if (!reportButton) return;

        reportButton.addEventListener('click', () => {
            modalOverlay.style.display = 'block';
        });

        const closeBtn = modalOverlay.querySelector('#close-modal');
        const submitBtn = modalOverlay.querySelector('#submit-report');

        closeBtn?.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });

        submitBtn?.addEventListener('click', () => {
            const selectedReasons = Array.from(
                modalOverlay.querySelectorAll('input[name="scamType"]:checked')
            ).map(input => (input as HTMLInputElement).value);

            if (selectedReasons.length === 0) {
                alert('Please select at least one reason.');
                return;
            }

            this.addReport({
                emailId: emailData.emailId,
                senderId: emailData.sender.id,
                emailTimeId: emailData.timestamp.id,
                senderInfo: { 
                    id: emailData.sender.id,
            }});

            uiManager.markEmailAsReported(emailData.emailId);
            modalOverlay.style.display = 'none';
        });
    }

    addReport(report: any): void {
        this.reportedEmails.push(report);
    }

    submitAllReports(): void {
        const reportData = {
            timestamp: Date.now(),
            totalEmails: document.querySelectorAll('.email-item').length,
            reportedEmails: this.reportedEmails,
            unreportedEmails: Array.from(document.querySelectorAll('.email-item:not(.reported)')).map(item => 
                parseInt(item.getAttribute('data-email-id') || '0')
            )
        };
        localStorage.setItem('reportData', JSON.stringify(reportData));
        window.location.href = 'report.html';
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userDataStr = urlParams.get('userData');
    
    if (!userDataStr) {
        document.querySelector("#results")!.innerHTML = '<p class="error">No user data found!</p>';
        return;
    }

    const userData: UserData = JSON.parse(decodeURIComponent(userDataStr));
    const name = `${userData.surname} ${userData.lastname}`;
    const selectedHobbies = [...userData.hobbies]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const emailManager = new EmailManager();
    const uiManager = new UIManager();
    const reportManager = new ReportManager();

    // Process each hobby
    for (const hobby of selectedHobbies) {
        try {
            const emailData = await emailManager.fetchEmail(name, hobby);
            const listItem = uiManager.createEmailListItem(emailData);
            
            listItem.addEventListener('click', () => {
                document.querySelectorAll('.email-item').forEach(item => 
                    item.classList.remove('active')
                );
                listItem.classList.add('active');
                uiManager.updateEmailContent(emailData);

                const modalOverlay = reportManager.createReportModal(emailData);
                document.body.appendChild(modalOverlay);
                
                // Add this line to handle the report
                reportManager.handleReport(emailData, modalOverlay, uiManager);
            });

            document.querySelector('#email-list')?.appendChild(listItem);
        } catch (error) {
            console.error(`Error processing hobby ${hobby}:`, error);
        }
    }

    uiManager.hideLoading();

    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-reports';
    submitButton.textContent = 'Submit All Reports';
    document.body.appendChild(submitButton);

    submitButton.addEventListener('click', () => {
        reportManager.submitAllReports();
    });
});