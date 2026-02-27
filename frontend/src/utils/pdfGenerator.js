import { jsPDF } from 'jspdf';

export const generatePerformanceReport = (user, tests) => {
    const doc = new jsPDF();
    const primaryColor = [102, 126, 234];
    const textColor = [51, 51, 51];
    const lightGray = [240, 240, 240];
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('JMC-TEST', 15, 20);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Performance Report', 15, 30);
    
    // Student Info
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 15, 55);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${user.name || 'N/A'}`, 15, 65);
    doc.text(`Email: ${user.email || 'N/A'}`, 15, 72);
    doc.text(`Department: ${user.department || 'N/A'}`, 15, 79);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 86);
    
    // Statistics
    if (tests && tests.length > 0) {
        const totalTests = tests.length;
        const passedTests = tests.filter(t => t.status === 'passed').length;
        const avgScore = Math.round(tests.reduce((sum, t) => sum + t.score, 0) / totalTests);
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Performance Summary', 15, 105);
        
        doc.setFillColor(...lightGray);
        doc.rect(15, 110, 40, 25, 'F');
        doc.rect(60, 110, 40, 25, 'F');
        doc.rect(105, 110, 40, 25, 'F');
        doc.rect(150, 110, 40, 25, 'F');
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Total Tests', 17, 117);
        doc.text('Passed', 62, 117);
        doc.text('Avg Score', 107, 117);
        doc.text('Pass Rate', 152, 117);
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.text(String(totalTests), 17, 128);
        doc.text(String(passedTests), 62, 128);
        doc.text(avgScore + '%', 107, 128);
        doc.text(Math.round((passedTests / totalTests) * 100) + '%', 152, 128);
        
        // Table
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.text('Test History', 15, 150);
        doc.setFillColor(...primaryColor);
        doc.rect(15, 155, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Test Name', 17, 160);
        doc.text('Company', 80, 160);
        doc.text('Score', 130, 160);
        doc.text('Status', 160, 160);
        
        let yPos = 168;
        doc.setTextColor(...textColor);
        doc.setFont(undefined, 'normal');
        tests.slice(0, 10).forEach((test, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(15, yPos - 5, 180, 8, 'F');
            }
            doc.text(test.testName.substring(0, 25), 17, yPos);
            doc.text(test.company.substring(0, 15), 80, yPos);
            doc.text(test.score + '%', 130, yPos);
            doc.text(test.status || 'N/A', 160, yPos);
            yPos += 10;
        });
    }
    
    doc.save(`JMC-TEST_Report_${user.name || 'Student'}.pdf`);
};

export const generateAnalyticsReport = (user, tests) => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.text('Analytics Report', 105, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text(user.name || 'Student', 105, 55, { align: 'center' });
    doc.save(`JMC-TEST_Analytics_${user.name || 'Student'}.pdf`);
};
