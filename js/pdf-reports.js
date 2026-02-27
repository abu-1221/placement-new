// JMC-TEST - Professional Reporting Module
// Handles PDF (jsPDF) and Data Exports for Students

/**
 * Main switch for generating performance reports
 */
function generatePerformanceReport(format = 'pdf') {
    if (format === 'pdf') {
        if (typeof jspdf === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => runPDFGeneration();
            document.head.appendChild(script);
        } else {
            runPDFGeneration();
        }
    } else if (format === 'excel') {
        generatePerformanceExcel();
    }
}

/**
 * PDF Generation Logic
 */
function runPDFGeneration() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];

    // Styling
    const brandColor = [102, 126, 234];

    // Header
    doc.setFillColor(...brandColor);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text('JMC-TEST PORTAL', 15, 25);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('OFFICIAL STUDENT PERFORMANCE REPORT', 15, 35);

    // Metadata
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Academic Profile', 15, 60);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${user.name || 'Student'}`, 15, 70);
    doc.text(`ID: ${user.username || 'N/A'}`, 15, 77);
    doc.text(`Stream: ${user.department || 'N/A'}`, 15, 84);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 91);

    if (tests.length === 0) {
        doc.text('No assessment records found.', 15, 110);
    } else {
        // Summary Cards
        doc.setFillColor(245, 247, 251);
        doc.rect(15, 105, 180, 30, 'F');

        const avg = Math.round(tests.reduce((s, t) => s + t.score, 0) / tests.length);
        const pass = tests.filter(t => t.status === 'passed').length;

        doc.setTextColor(...brandColor);
        doc.setFontSize(16);
        doc.text(String(tests.length), 30, 125);
        doc.text(`${avg}%`, 80, 125);
        doc.text(String(pass), 140, 125);

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Assessments', 30, 115);
        doc.text('Proficiency', 80, 115);
        doc.text('Qualified', 140, 115);

        // Table
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Results Breakdown', 15, 155);

        doc.setFillColor(...brandColor);
        doc.rect(15, 160, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('S.No', 20, 166.5);
        doc.text('Assessment / Company', 40, 166.5);
        doc.text('Score', 130, 166.5);
        doc.text('Status', 160, 166.5);

        let y = 178;
        doc.setTextColor(60, 60, 60);
        doc.setFont(undefined, 'normal');

        tests.forEach((t, i) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(String(i + 1), 20, y);
            doc.text(`${t.testName} (${t.company})`, 40, y);
            doc.text(`${t.score}%`, 130, y);
            doc.text((t.status || 'N/A').toUpperCase(), 160, y);
            y += 10;
        });
    }

    doc.save(`Performance_Report_${user.username}.pdf`);
    showNotification('Report Downloaded', 'Your academic record has been saved.', 'success');
}

/**
 * Excel (CSV Export) for Performance
 */
function generatePerformanceExcel() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];

    if (tests.length === 0) return alert('No data to export');

    let csv = "S.No,Test Name,Company,Date,Score,Status\n";
    tests.forEach((t, i) => {
        csv += `${i + 1},"${t.testName}","${t.company}","${new Date(t.date || t.createdAt).toLocaleDateString()}",${t.score}%,${t.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JMC_Score_Analysis_${user.username}.csv`;
    a.click();
}

/**
 * Attempt Summary (Detailed Session Log)
 */
function generateAttemptReport() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];

    if (tests.length === 0) return alert('No attempts found');

    let log = "--- JMC-TEST ATTEMPT SUMMARY ---\n";
    log += `Student: ${user.name} (${user.username})\n`;
    log += `Generated: ${new Date().toLocaleString()}\n\n`;

    tests.forEach((t, i) => {
        log += `${i + 1}. ${t.testName} | ${t.company}\n`;
        log += `   Accuracy: ${t.score}% | Status: ${t.status}\n`;
        log += `   Timestamp: ${new Date(t.date || t.createdAt).toLocaleString()}\n`;

        if (t.questionTimes) {
            const totalMs = Object.values(t.questionTimes).reduce((acc, curr) => acc + curr.total, 0);
            log += `   Time Invested: ${Math.round(totalMs / 1000 / 60)} minutes\n`;
        }
        log += "---------------------------------\n";
    });

    const blob = new Blob([log], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attempt_Summary_${user.username}.txt`;
    a.click();
}

/**
 * Score Analysis (View Only Summary)
 */
function generateScoreAnalysis() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];

    const summary = {
        total: tests.length,
        qualified: tests.filter(t => t.status === 'passed').length,
        avg: tests.length > 0 ? Math.round(tests.reduce((s, t) => s + t.score, 0) / tests.length) : 0
    };

    alert(`📊 Score Analysis for ${user.name}:\n\n` +
        `• Assessments Attempted: ${summary.total}\n` +
        `• Qualification Rate: ${summary.total > 0 ? Math.round((summary.qualified / summary.total) * 100) : 0}%\n` +
        `• Average Proficiency: ${summary.avg}%\n\n` +
        `Analysis based on verified institutional data.`);
}

// Export to window
window.generatePerformanceReport = generatePerformanceReport;
window.generateAttemptReport = generateAttemptReport;
window.generateScoreAnalysis = generateScoreAnalysis;
