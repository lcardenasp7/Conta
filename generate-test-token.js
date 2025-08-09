const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function generateTestToken() {
  try {
    // Find a user to generate token for
    const user = await prisma.user.findFirst({
      where: { isActive: true }
    });
    
    if (!user) {
      console.log('❌ No active user found');
      return;
    }
    
    console.log(`👤 Found user: ${user.name} (${user.email})`);
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n🔑 Generated token:');
    console.log(token);
    
    console.log('\n📋 To test in browser console, run:');
    console.log(`localStorage.setItem('token', '${token}');`);
    
    // Test the token by making a request
    console.log('\n🧪 Testing token with groups API...');
    
    const express = require('express');
    const app = express();
    
    // Simulate the API request
    const mockReq = {
      headers: {
        authorization: `Bearer ${token}`
      },
      query: {}
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📊 API Response (${code}):`, data);
        }
      }),
      json: (data) => {
        console.log('📊 API Response (200):', data);
      }
    };
    
    // Import and test the groups route handler
    const { authenticateToken } = require('./middleware/auth.middleware');
    
    // Test authentication
    await new Promise((resolve) => {
      authenticateToken(mockReq, mockRes, () => {
        console.log('✅ Token authentication successful');
        console.log('👤 Authenticated user:', mockReq.user);
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestToken();