// PDF Report Generation Module
// Uses jsPDF library to generate student placement reports

function generatePerformanceReport() {
    // Load jsPDF dynamically if not loaded
    if (typeof jsPDF === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => generatePDFReport();
        document.head.appendChild(script);
    } else {
        generatePDFReport();
    }
}

function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get user data
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];
    
    // Colors
    const primaryColor = [102, 126, 234];
    const textColor = [51, 51, 51];
    const lightGray = [240, 240, 240];
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('PlaceMe', 15, 20);
    
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
    doc.text(`Register No: ${user.registerNumber || 'N/A'}`, 15, 86);
    doc.text(`Class: ${user.className || 'N/A'}`, 15, 93);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 100);
    
    // Statistics
    if (tests.length > 0) {
        const totalTests = tests.length;
        const passedTests = tests.filter(t => t.status === 'passed').length;
        const avgScore = Math.round(tests.reduce((sum, t) => sum + t.score, 0) / totalTests);
        const highestScore = Math.max(...tests.map(t => t.score));
        const lowestScore = Math.min(...tests.map(t => t.score));
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Performance Summary', 15, 115);
        
        // Stats boxes
        doc.setFillColor(...lightGray);
        doc.rect(15, 120, 40, 25, 'F');
        doc.rect(60, 120, 40, 25, 'F');
        doc.rect(105, 120, 40, 25, 'F');
        doc.rect(150, 120, 40, 25, 'F');
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Total Tests', 17, 127);
        doc.text('Passed', 62, 127);
        doc.text('Avg Score', 107, 127);
        doc.text('Pass Rate', 152, 127);
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.text(String(totalTests), 17, 138);
        doc.text(String(passedTests), 62, 138);
        doc.text(avgScore + '%', 107, 138);
        doc.text(Math.round((passedTests / totalTests) * 100) + '%', 152, 138);
        
        // Test History
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Test History', 15, 160);
        
        // Table header
        doc.setFillColor(...primaryColor);
        doc.rect(15, 165, 180, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Test Name', 17, 170);
        doc.text('Company', 80, 170);
        doc.text('Score', 130, 170);
        doc.text('Status', 160, 170);
        
        // Table rows
        let yPos = 178;
        doc.setTextColor(...textColor);
        doc.setFont(undefined, 'normal');
        
        tests.slice(0, 10).forEach((test, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            // Alternating row colors
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(15, yPos - 5, 180, 8, 'F');
            }
            
            doc.text(test.testName.substring(0, 25), 17, yPos);
            doc.text(test.company.substring(0, 15), 80, yPos);
            doc.text(test.score + '%', 130, yPos);
            
            // Status with color
            if (test.status === 'passed') {
                doc.setTextColor(16, 185, 129);
                doc.text('Passed', 160, yPos);
            } else {
                doc.setTextColor(239, 68, 68);
                doc.text('Failed', 160, yPos);
            }
            doc.setTextColor(...textColor);
            
            yPos += 10;
        });
        
        // Insights
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 10;
        }
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Insights & Recommendations', 15, yPos);
        yPos += 10;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        // Performance trend
        if (avgScore >= 80) {
            doc.setTextColor(16, 185, 129);
            doc.text('✓ Excellent Performance! Keep up the great work.', 15, yPos);
        } else if (avgScore >= 60) {
            doc.setTextColor(245, 158, 11);
            doc.text('! Good progress. Focus on consistent improvement.', 15, yPos);
        } else {
            doc.setTextColor(239, 68, 68);
            doc.text('✗ Needs improvement. Consider additional practice.', 15, yPos);
        }
        yPos += 10;
        
        doc.setTextColor(...textColor);
        doc.text(`• Highest Score: ${highestScore}%`, 15, yPos);
        yPos += 7;
        doc.text(`• Lowest Score: ${lowestScore}%`, 15, yPos);
        yPos += 7;
        doc.text(`• Score Range: ${highestScore - lowestScore}% variation`, 15, yPos);
        
    } else {
        doc.setFontSize(12);
        doc.text('No test data available yet.', 15, 115);
        doc.setFontSize(10);
        doc.text('Take some tests to see your performance report!', 15, 125);
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('PlaceMe Placement Portal | Confidential', 105, 285, { align: 'center' });
    }
    
    // Save
    const fileName = `PlaceMe_Report_${user.name?.replace(/\s+/g, '_') || 'Student'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    // Show notification
    showNotification('Report Downloaded!', `${fileName} has been saved to your downloads.`, 'success');
}

// Generate comprehensive analytics report
function generateAnalyticsReport() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => generateAnalyticsPDF();
        document.head.appendChild(script);
    } else {
        generateAnalyticsPDF();
    }
}

function generateAnalyticsPDF() {
    const { jsPDF } = window.jspdf;
    const doc =new jsPDF();
    
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];
    
    // Title page
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('Analytics Report', 105, 60, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(user.name || 'Student', 105, 80, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 105, 90, { align: 'center' });
    
    // New page for detailed analytics
    doc.addPage();
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Detailed Performance Analytics', 15, 20);
    
    if (tests.length > 0) {
        // Company-wise performance
        doc.setFontSize(12);
        doc.text('Performance by Company', 15, 35);
        
        const companyStats = {};
        tests.forEach(test => {
            if (!companyStats[test.company]) {
                companyStats[test.company] = { total: 0, sum: 0 };
            }
            companyStats[test.company].total++;
            companyStats[test.company].sum += test.score;
        });
        
        let yPos = 45;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        Object.entries(companyStats).forEach(([company, stats]) => {
            const avg = Math.round(stats.sum / stats.total);
            doc.text(`${company}: ${avg}% average (${stats.total} tests)`, 15, yPos);
            
            // Progress bar
            doc.setFillColor(102, 126, 234);
            doc.rect(100, yPos - 3, (avg / 100) * 80, 4, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(100, yPos - 3, 80, 4, 'S');
            
            yPos += 10;
        });
        
        // Monthly trend
        yPos += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Monthly Performance Trend', 15, yPos);
        yPos += 10;
        
        const monthlyData = {};
        tests.forEach(test => {
            const month = new Date(test.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[month]) monthlyData[month] = [];
            monthlyData[month].push(test.score);
        });
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        Object.entries(monthlyData).forEach(([month, scores]) => {
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            doc.text(`${month}: ${avg}% average`, 15, yPos);
            yPos += 7;
        });
    }
    
    // Save
    const fileName = `PlaceMe_Analytics_${user.name?.replace(/\s+/g, '_') || 'Student'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showNotification('Analytics Report Downloaded!', fileName, 'success');
}

// Export functions
window.generatePerformanceReport = generatePerformanceReport;
window.generateAnalyticsReport = generateAnalyticsReport;
