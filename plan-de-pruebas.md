# PLAN DE PRUEBAS - APLICACIÓN DE AUTORREGULACIÓN EMOCIONAL

## 1. INTRODUCCIÓN

Este documento describe el plan de pruebas para la aplicación de autorregulación emocional, una plataforma diseñada para ayudar a niños con necesidades neurodiversas (autismo, TDAH, ansiedad) a gestionar sus emociones, desarrollar habilidades sociales y autorregularse en diferentes contextos.

### 1.1 Objetivo General
Garantizar la calidad, confiabilidad y seguridad de la aplicación mediante pruebas exhaustivas de todos los módulos, funcionalidades e integraciones.

### 1.2 Alcance
- Backend NestJS (servicios, controladores, integraciones)
- Base de datos MongoDB
- Autenticación y autorización
- Notificaciones en tiempo real (FCM)
- Gestión de emociones y autorregulación
- Dashboard de padres
- Sistema de recompensas (monedas)

---

## 2. TIPOS DE PRUEBAS A IMPLEMENTAR

### 2.1 PRUEBAS UNITARIAS
**Objetivo**: Validar la lógica de negocio de cada servicio de forma aislada.

#### Servicios a probar:
1. **AuthService** - Registro, login, validación de credenciales
2. **SelfRegulationService** - Activación del botón, alertas, contactos de emergencia
3. **DashboardService** - Cálculo de estadísticas, generación de alertas
4. **RecommendationsService** - Obtener recomendaciones por edad
5. **CoinsService** - Gestión de monedas de recompensa
6. **NonVerbalCommunicationService** - Interpretación de comunicación no verbal
7. **CalendarService** - Gestión de tareas y emociones diarias

#### Pruebas específicas:
- Validación de entrada de datos
- Manejo de errores y excepciones
- Lógica de negocio correcta
- Cálculos y transformaciones de datos

---

### 2.2 PRUEBAS FUNCIONALES
**Objetivo**: Verificar que cada función cumple con los requisitos especificados.

#### Flujos a validar:
1. **Autenticación**
   - Registro de padres y niños
   - Login con credenciales válidas/inválidas
   - Generación de tokens JWT
   - Validación de contraseñas

2. **Autorregulación**
   - Activación del botón con diferentes niveles (BAJO, MEDIO, ALTO, CRÍTICO)
   - Envío de alertas a padres
   - Envío de emails a contactos de emergencia
   - Registro de emociones asociadas
   - Resolución de eventos de crisis

3. **Dashboard**
   - Cálculo de porcentaje de tareas completadas
   - Generación de alertas dinámicas
   - Visualización de emociones (últimas 2 semanas)
   - Variación mensual de emociones
   - Mostrar eventos recientes de autorregulación

4. **Calendario**
   - Creación automática de bloques (mañana, tarde, noche)
   - Agregar tareas a bloques
   - Registrar emociones por período
   - Completar tareas
   - Eliminar tareas

5. **Monedas**
   - Obtener saldo de monedas
   - Agregar monedas
   - Actualizar monedas
   - Validación de operaciones

---

### 2.3 PRUEBAS DE INTEGRACIÓN
**Objetivo**: Verificar que los módulos funcionan correctamente en conjunto.

#### Integraciones a probar:
1. **Autenticación + Base de Datos**
   - Guardado de usuarios en MongoDB
   - Relación padre-hijo
   - Recuperación de datos de usuario

2. **Autorregulación + Notificaciones**
   - Activación del botón → Envío de notificación FCM
   - Escalado de alertas por nivel
   - Integración con email para contactos

3. **Calendar + Dashboard**
   - Datos de tareas en dashboard
   - Datos de emociones en estadísticas
   - Sincronización en tiempo real

4. **Recomendaciones + Edad del niño**
   - Obtener recomendaciones según grupo de edad
   - Filtrado por categoría
   - Inicialización de datos por defecto

5. **Comunicación No Verbal + Dashboard**
   - Sugerencias de interpretación
   - Asociación con emociones registradas

---

### 2.4 PRUEBAS DE REGRESIÓN
**Objetivo**: Asegurar que los cambios no rompan funcionalidad existente.

#### Casos clave:
1. Verificar que la autorregulación sigue funcionando después de cambios en notificaciones
2. Confirmar que el dashboard muestra datos correctos tras cambios en calendar
3. Validar que la autenticación funciona después de cambios de seguridad
4. Pruebas de monedas tras cambios en la lógica de recompensas
5. Validación de integridad de datos después de migraciones

---

### 2.5 PRUEBAS DE HUMO (SMOKE TESTING)
**Objetivo**: Verificar que las funcionalidades críticas funcionan en cada build.

#### Funcionalidades críticas:
1. ✅ Login de padre y niño
2. ✅ Activación del botón de autorregulación
3. ✅ Carga del dashboard
4. ✅ Registro de emociones
5. ✅ Creación de tareas
6. ✅ Envío de notificaciones
7. ✅ Operaciones de monedas
8. ✅ Acceso a recomendaciones

---

### 2.6 PRUEBAS E2E (END-TO-END)
**Objetivo**: Validar flujos completos del usuario desde inicio hasta fin.

#### Escenarios:
1. **Flujo de Crisis**
   - Padre crea cuenta
   - Agrega niño
   - Niño se registra
   - Niño activar botón de crisis
   - Padre recibe alerta
   - Padre marca como resuelto

2. **Gestión de Tareas y Emociones**
   - Padre crea tareas diarias
   - Niño completa tareas
   - Niño registra emociones
   - Dashboard muestra progreso
   - Niño gana monedas

3. **Rutina Escolar**
   - Crear calendario semanal
   - Registrar emociones en diferentes períodos
   - Ver tendencias emocionales
   - Recibir recomendaciones personalizadas

---

### 2.7 PRUEBAS DE RENDIMIENTO
**Objetivo**: Validar que el sistema maneja carga adecuadamente.

#### Escenarios:
1. **Carga de Dashboard**
   - Con 50+ tareas
   - Con 100+ registros de emociones
   - Con múltiples alertas sin resolver

2. **Envío de Notificaciones Masivas**
   - 100 notificaciones simultáneas
   - 1000 notificaciones distribuidas
   - Manejo de fallos

3. **Consultas de Base de Datos**
   - Obtener datos de 30 días
   - Filtros complejos
   - Poblaciones grandes

4. **Concurrencia**
   - Múltiples padres actualizando datos simultaneamente
   - Actualizaciones de monedas simultáneas
   - Escritura de emociones en paralelo

---

### 2.8 PRUEBAS DE SEGURIDAD
**Objetivo**: Validar que la aplicación protege datos sensibles.

#### Casos de prueba:
1. **Autenticación y Autorización**
   - Padres no pueden ver datos de otros padres
   - Niños no pueden acceder a funciones de padres
   - Tokens JWT inválidos son rechazados
   - Contraseñas se hashean correctamente

2. **Protección de Datos**
   - Validación de IDs de usuario
   - Prevención de acceso cruzado
   - Encriptación de datos sensibles

3. **Manejo de Errores**
   - No revelar información sensible en errores
   - Logs seguros sin exponer datos
   - Rate limiting para prevenir ataques

---

## 3. MATRIZ DE PRUEBAS

| ID | Tipo | Módulo | Descripción | Prioridad | Estado |
|----|------|--------|-------------|-----------|--------|
| UT-001 | Unitaria | Auth | Validar hash de contraseña | ALTA | ✅ |
| UT-002 | Unitaria | Auth | Rechazar emails duplicados | ALTA | ✅ |
| UT-003 | Unitaria | SelfRegulation | Generar alertas por nivel | ALTA | ✅ |
| UT-004 | Unitaria | SelfRegulation | Validar nivel de regulación | ALTA | ✅ |
| UT-005 | Unitaria | Dashboard | Calcular porcentaje de tareas | MEDIA | ✅ |
| UT-006 | Unitaria | Dashboard | Generar alertas dinámicas | MEDIA | ✅ |
| UT-007 | Unitaria | Calendar | Crear bloques automáticamente | MEDIA | ✅ |
| UT-008 | Unitaria | Coins | Incrementar monedas | MEDIA | ✅ |
| UT-009 | Unitaria | Recommendations | Mapear edad a grupo | BAJA | ✅ |
| UT-010 | Unitaria | NonVerbalComm | Interpretar gestos | BAJA | ✅ |
| FT-001 | Funcional | Auth | Flujo completo de registro | ALTA | ✅ |
| FT-002 | Funcional | Auth | Login con credenciales | ALTA | ✅ |
| FT-003 | Funcional | SelfRegulation | Activar botón CRÍTICO | CRÍTICA | ✅ |
| FT-004 | Funcional | SelfRegulation | Resolver evento | ALTA | ✅ |
| FT-005 | Funcional | Dashboard | Mostrar alertas sin resolver | ALTA | ✅ |
| FT-006 | Funcional | Calendar | CRUD de tareas | ALTA | ✅ |
| FT-007 | Funcional | Calendar | Registrar emociones | ALTA | ✅ |
| FT-008 | Funcional | Coins | Transacciones de monedas | MEDIA | ✅ |
| IT-001 | Integración | Auth+DB | Guardado y recuperación | ALTA | ✅ |
| IT-002 | Integración | SelfReg+Notif | Envío de alertas FCM | CRÍTICA | ✅ |
| IT-003 | Integración | SelfReg+Email | Alertas de emergencia | ALTA | ✅ |
| IT-004 | Integración | Calendar+Dashboard | Sincronización | MEDIA | ✅ |
| IT-005 | Integración | Recommendations+Age | Filtrado correcto | BAJA | ✅ |
| SM-001 | Smoke | Crítica | Login funciona | CRÍTICA | ✅ |
| SM-002 | Smoke | Crítica | Dashboard carga | CRÍTICA | ✅ |
| SM-003 | Smoke | Crítica | Botón autorregulación | CRÍTICA | ✅ |
| SM-004 | Smoke | Crítica | Crear tarea | CRÍTICA | ✅ |
| RG-001 | Regresión | Auth | Login continúa funcionando | ALTA | ✅ |
| RG-002 | Regresión | SelfRegulation | Alertas se envían correctamente | ALTA | ✅ |
| RG-003 | Regresión | Dashboard | Estadísticas correctas | MEDIA | ✅ |
| E2E-001 | E2E | Completo | Flujo de Crisis | CRÍTICA | ✅ |
| E2E-002 | E2E | Completo | Gestión de Tareas | ALTA | ✅ |
| E2E-003 | E2E | Completo | Rutina Escolar | MEDIA | ✅ |
| PERF-001 | Rendimiento | Dashboard | Carga 50+ tareas | MEDIA | ✅ |
| PERF-002 | Rendimiento | Notif | 100 notificaciones | MEDIA | ✅ |
| PERF-003 | Rendimiento | Concurrencia | Múltiples actualizaciones | MEDIA | ✅ |
| SEC-001 | Seguridad | Auth | Contraseña hasheada | CRÍTICA | ✅ |
| SEC-002 | Seguridad | Auth | Aislamiento de datos | CRÍTICA | ✅ |
| SEC-003 | Seguridad | Auth | Rate limiting | ALTA | ✅ |

---

## 4. ESTRATEGIA DE EJECUCIÓN

### 4.1 Fases de Prueba

**Fase 1: Pruebas Unitarias** (Semana 1-2)
- Desarrollar y ejecutar tests unitarios por servicio
- Cobertura mínima 80%
- Focus en lógica de negocio crítica

**Fase 2: Pruebas Funcionales** (Semana 2-3)
- Validar cada función según requisitos
- Pruebas de flujos principales
- Documentar bugs encontrados

**Fase 3: Pruebas de Integración** (Semana 3-4)
- Integración entre servicios
- Validación de datos end-to-end
- Pruebas con MongoDB real

**Fase 4: Pruebas de Regresión** (Semana 4)
- Verificar funcionalidad existente
- Pruebas de cambios recientes
- Validar hotfixes

**Fase 5: Pruebas E2E y Rendimiento** (Semana 5)
- Flujos completos
- Pruebas de carga
- Optimizaciones

---

### 4.2 Herramientas

- **Framework**: Jest
- **Base de Datos**: MongoMemoryServer para pruebas
- **Mocking**: jest.mock(), Sinon
- **Validación**: Supertest para APIs
- **Métricas**: Jest Coverage
- **Monitoreo**: Winston para logs

---

### 4.3 Criterios de Aceptación

- ✅ Cobertura mínima 80% en servicios críticos
- ✅ 100% de pruebas smoke deben pasar
- ✅ 0 defectos críticos o bloqueadores
- ✅ Tiempo de respuesta < 200ms
- ✅ Pruebas de seguridad sin vulnerabilidades

---

## 5. COMANDOS DE EJECUCIÓN

\`\`\`bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests de un archivo específico
npm run test -- auth.service.spec.ts

# Ejecutar tests de un patrón
npm run test -- --testPathPattern="smoke"
\`\`\`

---

## 6. REPORTE DE RESULTADOS

Después de ejecutar el plan, completar con:

### 6.1 Resumen Ejecutivo
- Pruebas ejecutadas: 39 / 39
- Pruebas pasadas: _____ / _____
- Defectos encontrados: _____
  - Críticos: _____ 
  - Altos: _____
  - Medios: _____
  - Bajos: _____

### 6.2 Cobertura de Código
- Lineas: ____%
- Funciones: ____%
- Ramas: ____%
- Statements: ____%

### 6.3 Rendimiento
- Latencia promedio: ____ ms
- Latencia máxima: ____ ms
- Throughput: ____ req/s

---

## 7. RESPONSABILIDADES

- **QA Lead**: Supervisar plan de pruebas
- **Desarrolladores**: Escribir tests unitarios
- **QA Engineers**: Pruebas funcionales e integración
- **DevOps**: Configurar CI/CD para tests
- **Gestor**: Reportar progreso

---

## 8. ARCHIVOS DE PRUEBA IMPLEMENTADOS

### Unit Tests
- `src/auth/auth.service.unit.spec.ts` - Tests UT-001, UT-002
- `src/self-regulation/self-regulation.service.spec.ts` - Tests UT-003, UT-004
- `src/dashboard/dashboard.service.spec.ts` - Tests UT-005, UT-006
- `src/calendar/calendar.service.spec.ts` - Tests UT-007
- `src/coins/coins.service.spec.ts` - Tests UT-008
- `src/recommendations/recommendations.service.spec.ts` - Tests UT-009
- `src/non-verbal-communication/non-verbal-communication.service.spec.ts` - Tests UT-010

### Functional Tests
- `test/functional/auth.functional.spec.ts` - Tests FT-001, FT-002
- `test/functional/calendar.functional.spec.ts` - Tests FT-006, FT-007
- `test/functional/dashboard.functional.spec.ts` - Tests FT-005
- `test/functional/coins.functional.spec.ts` - Tests FT-008
- `test/functional/recommendations.functional.spec.ts` - Tests recomendaciones
- `src/self-regulation/self-regulation.controller.spec.ts` - Tests FT-003, FT-004

### Integration Tests
- `test/integration/auth.integration.spec.ts` - Tests IT-001
- `test/integration/calendar.integration.spec.ts` - Tests PI-01-05
- `test/integration/self-regulation.integration.spec.ts` - Tests IT-002, IT-003
- `test/integration/coins.integration.spec.ts` - Tests IT-005
- `test/integration/recommendations.integration.spec.ts` - Tests IT-005

### Smoke Tests
- `test/smoke/critical-features.smoke.spec.ts` - Tests SM-001, SM-002, SM-003, SM-004

### Regression Tests
- `test/regression/calendar.regression.spec.ts` - Tests PR-01, PR-02, PR-03
- `test/regression/dashboard.regression.spec.ts` - Tests RG-003
- `test/regression/self-regulation.regression.spec.ts` - Tests RG-002
- `test/regression/auth-regression.spec.ts` - Tests RG-001

### E2E Tests
- `test/e2e/self-regulation.e2e.spec.ts` - Tests E2E-001, E2E-002, E2E-003
- `test/e2e/calendar.e2e.spec.ts` - Tests E2E adicionales

### Performance Tests
- `test/performance/self-regulation.performance.spec.ts` - Tests PERF-001, PERF-002, PERF-003
- `test/performance/notifications.performance.spec.ts` - Tests PERF-002 ampliados
- `test/performance/calendar.performance.spec.ts` - Tests de rendimiento

### Security Tests
- `test/security/auth-security.spec.ts` - Tests SEC-001, SEC-002, SEC-003
- `test/security/data-isolation.spec.ts` - Tests SEC-002, SEC-003

---

## 9. REFERENCIAS

- Requisitos funcionales del proyecto
- Documentación de API
- Esquemas MongoDB
- Flujos de usuario definidos

---

**Última actualización**: Enero 2025
**Versión**: 1.0 - COMPLETA CON IMPLEMENTACIÓN
**Estado**: ✅ Listo para ejecución - Todos los tests implementados
