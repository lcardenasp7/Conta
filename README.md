# 🏫 Sistema de Gestión Escolar - Villas de San Pablo

Un sistema completo de gestión escolar desarrollado con Node.js, Express, Prisma y PostgreSQL.

## 🌟 Características Principales

### 📚 Gestión Académica
- **Estudiantes**: Registro completo con 1340+ estudiantes
- **Grados y Grupos**: Organización académica estructurada
- **Matrículas**: Control de inscripciones por año académico

### 🎯 Sistema de Eventos Escolares
- **Creación de Eventos**: Modal profesional con múltiples tipos
- **Tipos de Eventos**: Bingo, Rifas, Recaudación, Derecho de Grado, Cultural, Deportivo
- **Asignación Inteligente**: Por grado, grupo o individual
- **Búsqueda Avanzada**: Acceso en tiempo real a todos los estudiantes

### 💰 Gestión Financiera
- **Facturación**: Sistema completo de facturación
- **Pagos**: Control de pagos y estados
- **Deudas**: Seguimiento de pendientes
- **Reportes**: Análisis financiero detallado

### 👥 Gestión de Usuarios
- **Autenticación**: Sistema seguro con JWT
- **Roles**: RECTOR, COORDINADOR, SECRETARIO, DOCENTE
- **Permisos**: Control granular de acceso

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Prisma** - ORM y migración de base de datos
- **PostgreSQL** - Base de datos principal
- **JWT** - Autenticación y autorización
- **bcrypt** - Encriptación de contraseñas

### Frontend
- **HTML5/CSS3** - Estructura y estilos
- **JavaScript ES6+** - Lógica del cliente
- **Bootstrap 5** - Framework CSS
- **Bootstrap Icons** - Iconografía
- **SweetAlert2** - Modales y alertas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/sistema-villas.git
   cd sistema-villas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/villas_db"
   JWT_SECRET="tu_jwt_secret_muy_seguro"
   PORT=3000
   ```

4. **Configurar la base de datos**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Iniciar el servidor**
   ```bash
   npm start
   ```

## 📁 Estructura del Proyecto

```
sistema-villas/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.js               # Datos iniciales
├── routes/
│   ├── auth.routes.js        # Rutas de autenticación
│   ├── student.routes.js     # Rutas de estudiantes
│   ├── event.routes.js       # Rutas de eventos
│   ├── grade.routes.js       # Rutas de grados
│   ├── invoice.routes.js     # Rutas de facturación
│   └── payment.routes.js     # Rutas de pagos
├── middleware/
│   └── auth.middleware.js    # Middleware de autenticación
├── public/
│   ├── css/
│   │   └── styles.css        # Estilos personalizados
│   ├── js/
│   │   ├── app.js           # Aplicación principal
│   │   ├── auth.js          # Autenticación
│   │   ├── events.js        # Gestión de eventos
│   │   ├── students.js      # Gestión de estudiantes
│   │   ├── grades.js        # Gestión de grados
│   │   ├── invoices.js      # Facturación
│   │   ├── payments.js      # Pagos
│   │   └── api.js           # Cliente API
│   └── index.html           # Página principal
├── scripts/
│   └── *.js                 # Scripts de utilidad
└── server.js                # Servidor principal
```

## 🎯 Funcionalidades del Sistema de Eventos

### Creación de Eventos
- **Modal Profesional**: Interfaz intuitiva con cards organizadas
- **Tipos Contextuales**: Terminología específica según el tipo de evento
- **Validaciones Completas**: Verificación de todos los campos

### Asignación de Estudiantes
- **Por Grado**: Asignación masiva a grados completos
- **Por Grupo**: Asignación específica a grupos seleccionados
- **Individual**: Búsqueda y selección manual de estudiantes
- **Búsqueda en Tiempo Real**: Acceso a 1340+ estudiantes

### Gestión de Eventos
- **Lista Completa**: Visualización de todos los eventos
- **Estados**: PLANNING, ACTIVE, COMPLETED, CANCELLED
- **Progreso**: Seguimiento de metas de recaudación
- **Acciones**: Ver, editar, eliminar eventos

## 🔐 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración
- **Encriptación**: Contraseñas hasheadas con bcrypt
- **Validación**: Sanitización de datos de entrada
- **Autorización**: Control de permisos por rol

## 📊 Base de Datos

### Modelos Principales
- **User**: Usuarios del sistema
- **Student**: Estudiantes (1340+ registros)
- **Grade**: Grados académicos
- **Group**: Grupos por grado
- **Event**: Eventos escolares
- **EventAssignment**: Asignaciones de eventos
- **Invoice**: Facturas
- **Payment**: Pagos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Sistema desarrollado para la Institución Educativa Villas de San Pablo**

---

⭐ Si este proyecto te ha sido útil, ¡no olvides darle una estrella!