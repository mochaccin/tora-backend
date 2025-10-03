## Estructura
```
self-regulation-app/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── jwt.strategy.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── tasks/
│   │   ├── tasks.controller.ts
│   │   ├── tasks.module.ts
│   │   └── tasks.service.ts
│   ├── emotions/
│   │   ├── emotions.controller.ts
│   │   ├── emotions.module.ts
│   │   └── emotions.service.ts
│   ├── calendar/
│   │   ├── calendar.controller.ts
│   │   ├── calendar.module.ts
│   │   └── calendar.service.ts
│   ├── shared/
│   │   └── schemas/
│   │       ├── user.schema.ts
│   │       ├── task.schema.ts
│   │       └── emotion.schema.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   └── app.e2e-spec.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

## Endpoints

### Authentication

POST /auth/register/parent - Register a parent

POST /auth/register/child - Register a child (parent must be logged in)

POST /auth/login - Login for both parents and children

### Tasks

POST /tasks - Create a task

GET /tasks - Get tasks (with optional date filter)

GET /tasks/:id - Get specific task

PUT /tasks/:id - Update task

DELETE /tasks/:id - Delete task

PUT /tasks/:id/complete - Mark task as completed

### Emotions

POST /emotions - Record an emotion

GET /emotions - Get emotions (with optional date filter)

GET /emotions/range - Get emotions by date range

GET /emotions/:id - Get specific emotion record

PUT /emotions/:id - Update emotion record

DELETE /emotions/:id - Delete emotion record

### Calendar

GET /calendar/daily - Get daily overview

GET /calendar/weekly - Get weekly overview

### Users

GET /users/children - Get parent's children (parents only)

GET /users/child/:id - Get child profile (parents only)

GET /users/profile - Get current user profile
