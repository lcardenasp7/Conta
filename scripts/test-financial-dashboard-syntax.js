#!/usr/bin/env node

/**
 * Test script to verify financial dashboard syntax is fixed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing financial dashboard syntax...');

try {
    // Read the financial dashboard file
    const dashboardPath = path.join(__dirname, '..', 'public', 'js', 'financial-dashboard-working.js');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    // Basic syntax check - look for common issues
    const issues = [];
    
    // Check for escaped backticks (should be fixed now)
    if (dashboardContent.includes('\\`')) {
        issues.push('❌ Found escaped backticks (\\`) - should use regular backticks (`)');
    } else {
        console.log('✅ No escaped backticks found');
    }
    
    // Check for unclosed template literals
    const backtickCount = (dashboardContent.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
        issues.push('❌ Odd number of backticks - possible unclosed template literal');
    } else {
        console.log('✅ Template literals appear to be properly closed');
    }
    
    // Check for function definition
    if (dashboardContent.includes('function initFinancialDashboard')) {
        console.log('✅ initFinancialDashboard function found');
    } else {
        issues.push('❌ initFinancialDashboard function not found');
    }
    
    // Check for global export
    if (dashboardContent.includes('window.initFinancialDashboard')) {
        console.log('✅ Function is exported to window object');
    } else {
        issues.push('❌ Function not exported to window object');
    }
    
    if (issues.length === 0) {
        console.log('\n🎉 All syntax checks passed!');
        console.log('💡 The financial dashboard should now load without syntax errors.');
        console.log('🔄 Please refresh your browser to see the changes.');
    } else {
        console.log('\n❌ Issues found:');
        issues.forEach(issue => console.log(issue));
    }
    
} catch (error) {
    console.error('❌ Error testing financial dashboard:', error.message);
}