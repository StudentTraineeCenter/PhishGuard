import { explanationArticles } from './explenation';

export function handleReport(modalOverlay: HTMLElement, emailId: number, timeId: number, senderId: number) { // Added senderId parameter
    // Uncheck all checkboxes
    const checkboxes = modalOverlay.querySelectorAll('input[name="scamType"]');
    checkboxes.forEach((checkbox) => {
        (checkbox as HTMLInputElement).checked = false;
    });
    modalOverlay.style.display = 'flex';

    modalOverlay.querySelector('#close-modal')?.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    modalOverlay.querySelector('form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const scamTypes = Array.from(
            modalOverlay.querySelectorAll('input[name="scamType"]:checked')
        ).map((checkbox) => (checkbox as HTMLInputElement).value);
        if (scamTypes.length > 0) {
            // Redirect to report.html with query parameters
            const params = new URLSearchParams({
                emailId: emailId.toString(),
                timeId: timeId.toString(),
                senderId: senderId.toString(), // Included senderId
                scamType: scamTypes
            });
            window.location.href = `report.html?${params.toString()}`;
        } else {
            alert('Please select at least one option.');
        }
    });
}

export function getStoredResults() {
    return JSON.parse(localStorage.getItem('reportData') || '{}');
}

export function getExpectedReasons(emailTimeId: number, senderId: number): string[] {
    // Define the base array that will always include 'Message'
    let expectedScams = ['Message'];

    // Check time-based conditions
    if (emailTimeId === 3) {
        expectedScams.push('Wrong time');
    }

    // Check sender-based conditions using sender ID
    if (senderId === 2 || senderId === 3) {
        expectedScams.push('Wrong sender name');
    }

    if (senderId === 4) {
        expectedScams.push('Wrong domain');
    }

    // Sort the array to ensure consistent order
    return expectedScams.sort();
}

export function createStyledReport(results) {
    const correctCount = results.reportedEmails.filter(email => {
        const expectedReasons = getExpectedReasons(
            email.emailTimeId, 
            email.senderInfo.senderId || email.senderInfo.id // Try both properties
        );
        const reportedReasons = [...email.reasons].sort();
        return JSON.stringify(expectedReasons) === JSON.stringify(reportedReasons);
    }).length;

    // Calculate accuracy
    const accuracy = results.reportedEmails.length > 0
        ? ((correctCount / results.reportedEmails.length) * 100).toFixed(1)
        : '0.0';

    const stats = `
        <div class="report-header">
            <h1>Email Report Analysis</h1>
            <p>Session Date: ${new Date(results.timestamp).toLocaleString()}</p>
        </div>
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-number">${results.totalEmails}</div>
                <div>Total Emails</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${results.reportedEmails.length}</div>
                <div>Total Reported</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${correctCount}</div>
                <div>Correctly Recognized</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${accuracy}%</div>
                <div>Recognition Accuracy</div>
            </div>
        </div>
    `;

    const emailReports = results.reportedEmails.map(email => {
        const expectedReasons = getExpectedReasons(email.emailTimeId, parseInt(email.senderInfo.id)); // Use senderId instead of id
        const reportedReasons = [...email.reasons].sort();
        const isCorrect = JSON.stringify(expectedReasons) === JSON.stringify(reportedReasons);

        // Generate explanations for reported reasons
        const correctReasons = reportedReasons.filter(reason => expectedReasons.includes(reason));
        const wrongReasons = reportedReasons.filter(reason => !expectedReasons.includes(reason));
        const missedReasons = expectedReasons.filter(reason => !reportedReasons.includes(reason));

        const explanationsHtml = `
            <div class="explanations">
                <h3>Detailed Analysis</h3>
                ${correctReasons.length > 0 ? `
                    <div class="correct-explanations">
                        <h4>✓ Correctly Identified Issues</h4>
                        ${correctReasons.map(reason => `
                            <div class="explanation-item correct">
                                <h5>${reason}</h5>
                                <div class="explanation-content">
                                    ${explanationArticles[reason].split('•').map((point, index) => 
                                        index === 0 ? `<p>${point.trim()}</p>` : `<li>${point.trim()}</li>`
                                    ).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${wrongReasons.length > 0 ? `
                    <div class="wrong-explanations">
                        <h4>⚠ Incorrectly Reported Issues</h4>
                        ${wrongReasons.map(reason => `
                            <div class="explanation-item wrong">
                                <h5>${reason}</h5>
                                <div class="explanation-content">
                                    <p><strong>This was not a valid issue because:</strong></p>
                                    ${explanationArticles[reason].split('•').map((point, index) => 
                                        index === 0 ? `<p>${point.trim()}</p>` : `<li>${point.trim()}</li>`
                                    ).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${missedReasons.length > 0 ? `
                    <div class="missed-explanations">
                        <h4>! Missed Issues</h4>
                        ${missedReasons.map(reason => `
                            <div class="explanation-item missed">
                                <h5>${reason}</h5>
                                <div class="explanation-content">
                                    <p><strong>You should have reported this because:</strong></p>
                                    ${explanationArticles[reason].split('•').map((point, index) => 
                                        index === 0 ? `<p>${point.trim()}</p>` : `<li>${point.trim()}</li>`
                                    ).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>`;

        return `
            <div class="task email-task">
                <div class="email-item ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="email-id">Email #${email.emailId}</div>
                    <div class="email-details">
                        <div class="email-from">From: ${email.senderInfo.email} (ID: ${email.senderInfo.id})</div> <!-- Use senderId -->
                        <div class="email-time">Time ID: ${email.emailTimeId} (${email.emailTime})</div>
                        <div class="reasons">
                            <div class="expected">Expected Issues: ${expectedReasons.join(', ')}</div>
                            <div class="reported">Reported Issues: ${reportedReasons.join(', ')}</div>
                        </div>
                        <div class="status">${isCorrect ? '✓ Correct' : '✗ Incorrect'}</div>
                    </div>
                    ${explanationsHtml}
                </div>
            </div>
        `;
    }).join('');

    const unreported = results.unreportedEmails.length > 0 
        ? `
            <div class="tasks">
                <div class="task email-task">
                    <div class="email-item missed">
                        <div class="email-id">Unreported Emails</div>
                        ${results.unreportedEmails.map(emailId => {
                            const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
                            const timeId = parseInt(emailItem?.getAttribute('data-time-id') || '0');
                            const senderId = parseInt(emailItem?.getAttribute('data-sender-id') || '0'); // Use 'data-sender-id' if that's what you set
                            const expectedReasons = getExpectedReasons(timeId, senderId);
                            
                            return `
                                <div class="email-details">
                                    <div class="expected">Email #${emailId}: Issues that should have been reported: ${expectedReasons.join(', ')}</div>
                                    <div class="status missed">✗ Not Reported</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `
        : '';

    return `${stats}${emailReports}${unreported}`;
}