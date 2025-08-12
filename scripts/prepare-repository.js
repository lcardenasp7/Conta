const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function prepareRepository() {
    console.log('🚀 PREPARANDO REPOSITORIO PARA SUBIR A GIT');
    console.log('=' .repeat(60));
    
    try {
        // 1. Verificar archivos importantes
        console.log('\n📋 1. VERIFICANDO ARCHIVOS IMPORTANTES');
        console.log('-'.repeat(40));
        
        const importantFiles = [
            'package.json',
            'server.js',
            'prisma/schema.prisma',
            'README.md',
            'LICENSE',
            '.gitignore',
            'CHANGELOG.md'
        ];
        
        importantFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file}`);
            } else {
                console.log(`❌ ${file} - FALTANTE`);
            }
        });
        
        // 2. Verificar estructura de directorios
        console.log('\n📁 2. VERIFICANDO ESTRUCTURA');
        console.log('-'.repeat(40));
        
        const directories = [
            'routes',
            'middleware',
            'services',
            'public/js',
            'public/css',
            'scripts',
            'prisma'
        ];
        
        directories.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                console.log(`✅ ${dir}/ (${files.length} archivos)`);
            } else {
                console.log(`❌ ${dir}/ - FALTANTE`);
            }
        });
        
        // 3. Contar archivos por tipo
        console.log('\n📊 3. ESTADÍSTICAS DEL PROYECTO');
        console.log('-'.repeat(40));
        
        const stats = {
            js: 0,
            json: 0,
            md: 0,
            css: 0,
            html: 0,
            prisma: 0
        };
        
        function countFiles(dir) {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    countFiles(filePath);
                } else if (stat.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    switch (ext) {
                        case '.js': stats.js++; break;
                        case '.json': stats.json++; break;
                        case '.md': stats.md++; break;
                        case '.css': stats.css++; break;
                        case '.html': stats.html++; break;
                        case '.prisma': stats.prisma++; break;
                    }
                }
            });
        }
        
        countFiles('.');
        
        console.log(`📄 Archivos JavaScript: ${stats.js}`);
        console.log(`📋 Archivos JSON: ${stats.json}`);
        console.log(`📝 Archivos Markdown: ${stats.md}`);
        console.log(`🎨 Archivos CSS: ${stats.css}`);
        console.log(`🌐 Archivos HTML: ${stats.html}`);
        console.log(`🗄️  Archivos Prisma: ${stats.prisma}`);
        
        // 4. Verificar .env.example
        console.log('\n🔐 4. VERIFICANDO CONFIGURACIÓN');
        console.log('-'.repeat(40));
        
        if (fs.existsSync('.env.example')) {
            console.log('✅ .env.example existe');
        } else {
            console.log('⚠️  Creando .env.example...');
            const envExample = `# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/school_management"

# JWT
JWT_SECRET="tu-clave-secreta-muy-segura-cambiar-en-produccion"

# Server
NODE_ENV="development"
PORT=3000

# Email (opcional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-password-de-aplicacion"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Railway (producción)
RAILWAY_ENVIRONMENT_NAME=""
`;
            fs.writeFileSync('.env.example', envExample);
            console.log('✅ .env.example creado');
        }
        
        // 5. Verificar que .env esté en .gitignore
        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
        if (gitignoreContent.includes('.env')) {
            console.log('✅ .env está en .gitignore');
        } else {
            console.log('❌ .env NO está en .gitignore');
        }
        
        // 6. Comandos de Git sugeridos
        console.log('\n🔧 5. COMANDOS DE GIT SUGERIDOS');
        console.log('-'.repeat(40));
        
        console.log('Para inicializar el repositorio:');
        console.log('git init');
        console.log('git add .');
        console.log('git commit -m "🎉 Initial commit: Sistema de Gestión Escolar v1.0.0"');
        console.log('');
        console.log('Para conectar con GitHub:');
        console.log('git remote add origin https://github.com/tu-usuario/sistema-villas.git');
        console.log('git branch -M main');
        console.log('git push -u origin main');
        
        // 7. Información del proyecto
        console.log('\n📋 6. INFORMACIÓN DEL PROYECTO');
        console.log('-'.repeat(40));
        
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`📦 Nombre: ${packageJson.name}`);
        console.log(`🔢 Versión: ${packageJson.version}`);
        console.log(`📝 Descripción: ${packageJson.description || 'Sistema de Gestión Escolar'}`);
        console.log(`👤 Autor: ${packageJson.author || 'I.E.D. Villas de San Pablo'}`);
        console.log(`📄 Licencia: ${packageJson.license}`);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ REPOSITORIO LISTO PARA SUBIR');
        console.log('🚀 Ejecuta los comandos de Git mostrados arriba');
        console.log('=' .repeat(60));
        
    } catch (error) {
        console.error('❌ Error preparando repositorio:', error.message);
    }
}

prepareRepository();