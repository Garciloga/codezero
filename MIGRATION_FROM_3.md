# Migración desde CodeZero 3.0

El HTML 3.0 se conserva en `legacy/CodeZero_3.0.html`.

La migración real debe extraer sus 15 niveles y convertirlos en datos:

- courses
- levels
- topics
- lessons
- exercises
- quizzes
- exams
- projects
- skills

El progreso actual de localStorage NO debe considerarse una fuente segura para cuentas de pago. Si hubiera usuarios reales en el prototipo, habría que crear un proceso explícito de importación y validación.

## 15 niveles

1. Pensamiento computacional
2. Python desde cero
3. Python intermedio y código limpio
4. Algoritmos y estructuras de datos
5. Git, terminal y flujo profesional
6. Bases de datos y SQL
7. Web: HTML + CSS + JavaScript
8. Backend y APIs
9. Ingeniería de software
10. Capstone · Proyecto profesional
11. Integraciones I · APIs y webhooks
12. Integraciones II · SaaS, OAuth y automatización
13. Integraciones III · Sistemas empresariales
14. Integraciones IV · Arquitectura y seguridad
15. Integraciones V · Capstone profesional
