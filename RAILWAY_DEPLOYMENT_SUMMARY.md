# RESUMEN DE DESPLIEGUE - RAILWAY
================================

## ✅ DATOS QUE SE CREARÁN EN PRODUCCIÓN:

### 🏫 Institución
- Institución Educativa Distrital Villas de San Pablo
- NIT: 901.079.125-0
- Información completa de la institución

### 👥 Usuarios Administrativos
- Rector: rector@villasanpablo.edu.co (Contraseña: VillasSP2024!)
- Auxiliar Contable: contabilidad@villasanpablo.edu.co (Contraseña: ContaVSP2024!)

### 📚 Estructura Académica
- Grados desde Preescolar hasta Undécimo
- Grupos 01-06 para cada grado
- Capacidad de 30 estudiantes por grupo

### 💰 Sistema Financiero
- Plan de cuentas contable colombiano
- Sistema de fondos institucionales
- Cuentas básicas de activos, pasivos, patrimonio, ingresos y gastos

## ❌ DATOS QUE NO SE CREARÁN:

- ❌ Estudiantes de prueba
- ❌ Facturas de prueba  
- ❌ Pagos de prueba
- ❌ Eventos de prueba
- ❌ Datos simulados

## 📋 DESPUÉS DEL DESPLIEGUE:

1. Acceder con las credenciales administrativas
2. Importar estudiantes reales usando el sistema
3. Crear eventos académicos reales
4. Comenzar operación normal del sistema

## 🔧 COMANDOS RAILWAY:

```bash
# Para ejecutar el seed de producción
railway run node scripts/railway-production-seed.js

# Para verificar la base de datos
railway run node scripts/railway-db-check.js
```

Fecha de preparación: 18/8/2025, 7:32:03 p. m.
