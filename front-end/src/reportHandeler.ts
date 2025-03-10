import { explanationArticles } from './explenation';

// Original function for backward compatibility
export function handleReport(modalOverlay: HTMLElement, emailId: number, timeId: number, senderId: number) {
    // Simply create and use our class implementation
    new ReportHandler(modalOverlay, emailId, timeId, senderId);
}

// Original function for backward compatibility
export function getStoredResults() {
    return ReportHandler.getStoredResults();
}

// Original function for backward compatibility
export function getExpectedReasons(emailTimeId: number, senderId: number): string[] {
    return ExpectedReasonsCalculator.calculate(emailTimeId, senderId);
}

// Original function for backward compatibility
export function createStyledReport(results: any) {
    const analyzer = new ResultAnalyzer(results);
    return analyzer.generateReport();
}

interface ReportEmail {
    emailId: number;
    emailTimeId: number;
    senderInfo: {
        id: number;
        email: string;
    };
    reasons: string[];
    emailTime?: string;
}

interface ReportResults {
    timestamp: number;
    totalEmails: number;
    reportedEmails: ReportEmail[];
    unreportedEmails: number[];
}

class ExpectedReasonsCalculator {
    static calculate(emailTimeId: number, senderId: number): string[] {
        let expectedScams = ['Message'];

        if (emailTimeId === 3) {
            expectedScams.push('Wrong time');
        }

        if (senderId === 2 || senderId === 3) {
            expectedScams.push('Wrong sender name');
        }

        if (senderId === 4) {
            expectedScams.push('Wrong domain');
        }

        return expectedScams.sort();
    }
}

class ReportHandler {
    private modalOverlay: HTMLElement;
    private emailId: number;
    private timeId: number;
    private senderId: number;

    constructor(modalOverlay: HTMLElement, emailId: number, timeId: number, senderId: number) {
        this.modalOverlay = modalOverlay;
        this.emailId = emailId;
        this.timeId = timeId;
        this.senderId = senderId;
        this.initializeHandlers();
    }

    private initializeHandlers(): void {
        this.uncheckAllCheckboxes();
        this.showModal();
        this.setupCloseHandler();
        this.setupSubmitHandler();
    }

    private uncheckAllCheckboxes(): void {
        const checkboxes = this.modalOverlay.querySelectorAll('input[name="scamType"]');
        checkboxes.forEach((checkbox) => {
            (checkbox as HTMLInputElement).checked = false;
        });
    }

    private showModal(): void {
        this.modalOverlay.style.display = 'flex';
    }

    private setupCloseHandler(): void {
        this.modalOverlay.querySelector('#close-modal')?.addEventListener('click', () => {
            this.modalOverlay.style.display = 'none';
        });
    }

    private setupSubmitHandler(): void {
        this.modalOverlay.querySelector('form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const scamTypes = this.getSelectedScamTypes();
            
            if (scamTypes.length > 0) {
                this.redirectToReport(scamTypes);
            } else {
                alert('Please select at least one option.');
            }
        });
    }

    private getSelectedScamTypes(): string[] {
        return Array.from(
            this.modalOverlay.querySelectorAll('input[name="scamType"]:checked')
        ).map((checkbox) => (checkbox as HTMLInputElement).value);
    }

    private redirectToReport(scamTypes: string[]): void {
        const params = new URLSearchParams({
            emailId: this.emailId.toString(),
            timeId: this.timeId.toString(),
            senderId: this.senderId.toString(),
            scamType: scamTypes
        });
        window.location.href = `report.html?${params.toString()}`;
    }

    static getStoredResults(): ReportResults {
        return JSON.parse(localStorage.getItem('reportData') || '{}');
    }
}

class ResultAnalyzer {
    private results: ReportResults;

    constructor(results: ReportResults) {
        this.results = results;
    }

    generateReport(): string {
        return `
            ${this.createStatsSection()}
            ${this.createEmailReportsSection()}
            ${this.createUnreportedSection()}
        `;
    }

    private createStatsSection(): string {
        const { correctCount, accuracy } = this.calculateStats();
        return `
            <div class="report-header">
                <h1>Email Report Analysis</h1>
                <p>Session Date: ${new Date(this.results.timestamp).toLocaleString()}</p>
            </div>
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-number">${this.results.totalEmails}</div>
                    <div>Total Emails</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${this.results.reportedEmails.length}</div>
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
    }

    private calculateStats(): { correctCount: number; accuracy: string } {
        const correctCount = this.results.reportedEmails.filter(email => {
            const expectedReasons = ExpectedReasonsCalculator.calculate(
                email.emailTimeId,
                email.senderInfo.id
            );
            const reportedReasons = [...email.reasons].sort();
            return JSON.stringify(expectedReasons) === JSON.stringify(reportedReasons);
        }).length;

        const accuracy = this.results.reportedEmails.length > 0
            ? ((correctCount / this.results.reportedEmails.length) * 100).toFixed(1)
            : '0.0';

        return { correctCount, accuracy };
    }

    private createEmailReportsSection(): string {
        return this.results.reportedEmails.map(email => {
            const expectedReasons = ExpectedReasonsCalculator.calculate(email.emailTimeId, parseInt(email.senderInfo.id)); // Use senderId instead of id
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
    }

    private createUnreportedSection(): string {
        return this.results.unreportedEmails.length > 0 
            ? `
                <div class="tasks">
                    <div class="task email-task">
                        <div class="email-item missed">
                            <div class="email-id">Unreported Emails</div>
                            ${this.results.unreportedEmails.map(emailId => {
                                const emailItem = document.querySelector(`[data-email-id="${emailId}"]`);
                                const timeId = parseInt(emailItem?.getAttribute('data-time-id') || '0');
                                const senderId = parseInt(emailItem?.getAttribute('data-sender-id') || '0'); // Use 'data-sender-id' if that's what you set
                                const expectedReasons = ExpectedReasonsCalculator.calculate(timeId, senderId);
                                
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
    }
}

export { ReportHandler, ResultAnalyzer, ExpectedReasonsCalculator };
export type { ReportResults, ReportEmail };