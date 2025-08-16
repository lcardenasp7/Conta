#!/usr/bin/env node

/**
 * Script para probar las facturas en formato media hoja carta
 */

const fs = require('fs');

console.log('📄 Testing Half Page Invoice Format...\n');

// Verificar que el servicio de facturas existe
console.log('📋 Checking invoice generator service:');

const invoiceServicePath = 'services/invoice-generator.service.js';
if (fs.existsSync(invoiceServicePath)) {
    console.log('✅ Invoice generator service - exists');
    
    const serviceContent = fs.readFileSync(invoiceServicePath, 'utf8');
    
    // Verificar nuevas funciones para media hoja
    const functionsToCheck = [
        'renderHalfPageInvoice',
        'addHalfPageHeader', 
        'addHalfPageInfo',
        'addHalfPageItems',
        'addHalfPageTotals',
        'addHalfPageFooter'
    ];
    
    console.log('\n🔧 Checking half-page functions:');
    functionsToCheck.forEach(func => {
        if (serviceContent.includes(func)) {
            console.log(`✅ ${func} - implemented`);
        } else {
            console.log(`❌ ${func} - missing`);
        }
    });
    
    // Verificar tamaño de página
    if (serviceContent.includes('size: [612, 396]')) {
        console.log('✅ Half page size (8.5" x 5.5") - configured');
    } else {
        console.log('❌ Half page size - not configured');
    }
    
    // Verificar nuevos teléfonos
    if (serviceContent.includes('3004566968-3012678548')) {
        console.log('✅ Updated phone numbers - implemented');
    } else {
        console.log('❌ Updated phone numbers - missing');
    }
    
    // Verificar márgenes reducidos
    if (serviceContent.includes('margin: 25')) {
        console.log('✅ Reduced margins for half page - configured');
    } else {
        console.log('❌ Reduced margins - not configured');
    }
    
} else {
    console.log('❌ Invoice generator service - missing');
}

console.log('\n📐 Half Page Invoice Specifications:');
console.log('• Size: 8.5" x 5.5" (612 x 396 points)');
console.log('• Margins: 25 points (reduced from 40)');
console.log('• Layout: Compact single-page design');
console.log('• Fonts: Smaller sizes (6-9pt vs 8-12pt)');
console.log('• Phone: 3004566968-3012678548');

console.log('\n🧪 Testing Instructions:');
console.log('1. Go to Invoices section');
console.log('2. Create or select an existing invoice');
console.log('3. Click "Download PDF" or "Generate PDF"');
console.log('4. Verify the PDF is in half-page format');
console.log('5. Check that all information fits without overlapping');
console.log('6. Verify phone numbers are updated');

console.log('\n📋 Expected Results:');
console.log('✅ PDF should be 8.5" x 5.5" (half letter size)');
console.log('✅ All content should fit on one page');
console.log('✅ No text overlapping or cutoff');
console.log('✅ Phone numbers: 3004566968-3012678548');
console.log('✅ Compact but readable layout');

console.log('\n🔧 Troubleshooting:');
console.log('• If PDF is still A4 size: Restart server to load changes');
console.log('• If text overlaps: Check font sizes and spacing');
console.log('• If content cuts off: Verify page dimensions');
console.log('• If old phones appear: Clear browser cache');

console.log('\n✅ Half page invoice format ready for testing!');
console.log('🚀 Generate a test invoice to verify the changes...');