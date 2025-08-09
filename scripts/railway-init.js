const { PrismaClient } = require('@prisma/client');

async function initializeRailwayDatabase() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🚀 Initializing Railway database...');
        
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connection successful');
        
        // Check if database is already initialized
        const userCount = await prisma.user.count();
        
        if (userCount === 0) {
            console.log('📊 Database is empty, running seed...');
            
            // Import and run seed
            const { seedDatabase } = require('../prisma/seed');
            await seedDatabase();
            
            console.log('✅ Database seeded successfully');
        } else {
            console.log(`📊 Database already has ${userCount} users, skipping seed`);
        }
        
        console.log('🎉 Railway database initialization complete!');
        
    } catch (error) {
        console.error('❌ Railway database initialization failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    initializeRailwayDatabase();
}

module.exports = { initializeRailwayDatabase };