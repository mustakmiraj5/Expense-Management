# How to Write Jest Tests for NestJS — A Complete Guide

This document explains every testing pattern used across this project's backend test suite.
Read it top-to-bottom the first time; after that, use section headings as a reference.

---

## Table of Contents

1. [Why Tests Exist and What They Do](#1-why-tests-exist-and-what-they-do)
2. [Three Layers of Tests in This Project](#2-three-layers-of-tests-in-this-project)
3. [Core Vocabulary](#3-core-vocabulary)
4. [Service Unit Tests — How They Work](#4-service-unit-tests--how-they-work)
5. [Mocking with jest.fn()](#5-mocking-with-jestfn)
6. [Mocking an Entire Module (bcrypt)](#6-mocking-an-entire-module-bcrypt)
7. [Mocking Prisma's $transaction](#7-mocking-prismas-transaction)
8. [The NestJS TestingModule](#8-the-nestjs-testingmodule)
9. [Testing Exceptions (rejects.toThrow)](#9-testing-exceptions-rejectsthrow)
10. [Inspecting Mock Call Arguments](#10-inspecting-mock-call-arguments)
11. [Controller Integration Tests — How They Work](#11-controller-integration-tests--how-they-work)
12. [Supertest — Making Real HTTP Requests in Tests](#12-supertest--making-real-http-requests-in-tests)
13. [Mocking Guards (JWT Auth)](#13-mocking-guards-jwt-auth)
14. [Injecting a Fake User via Guards](#14-injecting-a-fake-user-via-guards)
15. [Testing ValidationPipe (DTOs)](#15-testing-validationpipe-dtos)
16. [E2E Tests — How They Work](#16-e2e-tests--how-they-work)
17. [Test Structure Patterns (beforeEach, afterEach)](#17-test-structure-patterns-beforeeach-aftereach)
18. [Common Matchers Reference](#18-common-matchers-reference)
19. [Patterns to Avoid](#19-patterns-to-avoid)
20. [How to Run the Tests](#20-how-to-run-the-tests)

---

## 1. Why Tests Exist and What They Do

Tests are code that **calls your real code** and checks that the output matches your expectations.
Without tests, the only way to verify something works is to run the whole app and click through it manually — which takes minutes, is error-prone, and breaks silently over time.

A test gives you a machine that re-checks the same scenario in milliseconds every time you save.

**What a test answers:**
- "Does this function return what I think it returns?"
- "Does it throw the right exception when something goes wrong?"
- "Does calling this HTTP endpoint with a bad body return 400?"

---

## 2. Three Layers of Tests in This Project

| Layer | Files | What it tests | Real DB? | Real HTTP? |
|-------|-------|---------------|----------|------------|
| **Service unit** | `*.service.spec.ts` | Business logic inside a service class | No (mocked) | No |
| **Controller integration** | `*.controller.spec.ts` | HTTP routing, guards, DTO validation | No (mocked) | Yes (via Supertest) |
| **E2E** | `test/*.e2e-spec.ts` | The whole app as a black box | No (mocked) | Yes (via Supertest) |

Each layer builds on the one below it:
- Unit tests are the fastest — they only test one class in isolation.
- Controller tests test that routing + validation wire up correctly.
- E2E tests test the full request lifecycle.

---

## 3. Core Vocabulary

| Term | Meaning |
|------|---------|
| `describe` | Groups related tests under a label |
| `it` / `test` | A single test case |
| `expect` | Starts an assertion — e.g. "I expect this value to equal X" |
| `beforeEach` | Runs setup code before every `it` block in the current `describe` |
| `afterEach` | Runs cleanup code after every `it` block |
| `beforeAll` | Runs once before all tests in the file |
| `afterAll` | Runs once after all tests in the file |
| `jest.fn()` | Creates a fake function that records how it was called |
| `mockResolvedValue(x)` | Makes a `jest.fn()` return `Promise.resolve(x)` |
| `mockReturnValue(x)` | Makes a `jest.fn()` return `x` synchronously |
| `jest.clearAllMocks()` | Resets all call history and return values on every mock |

---

## 4. Service Unit Tests — How They Work

A service has **zero HTTP awareness**. It just takes arguments, calls Prisma (or another service), and returns a result.
Testing it means: provide a fake Prisma, call the service method, assert the output.

**Full example — `expenses.service.spec.ts`:**

```typescript
// 1. Describe the class being tested
describe('ExpensesService', () => {
  let service: ExpensesService;

  // 2. Create a fake PrismaService — only the methods we need
  const mockPrisma = {
    expense: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    // 3. Build a tiny NestJS module with only ExpensesService + fake Prisma
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma }, // swap real → fake
      ],
    }).compile();

    // 4. Get an instance of the real service from the module
    service = module.get<ExpensesService>(ExpensesService);

    // 5. Reset all mock call history before each test
    jest.clearAllMocks();
  });

  it('should return paginated expenses with meta', async () => {
    // 6. Tell the fake what to return for this specific test
    mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);
    mockPrisma.expense.count.mockResolvedValue(1);

    // 7. Call the real service method
    const result = await service.findAll(1, { page: 1, limit: 20 });

    // 8. Assert the output
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });
});
```

**Why `{ provide: PrismaService, useValue: mockPrisma }`?**

NestJS uses dependency injection — services receive their dependencies through the constructor.
When you write `{ provide: PrismaService, useValue: mockPrisma }`, you tell the module:
"Wherever a class asks for `PrismaService`, give it `mockPrisma` instead."
The real service never knows the difference — it just calls `this.prisma.expense.findMany(...)`,
which in tests resolves to the fake function.

---

## 5. Mocking with jest.fn()

`jest.fn()` creates a function that:
- Does nothing by default (returns `undefined`)
- Records every call made to it (arguments, number of calls, return values)
- Can be told what to return per test

**The key methods:**

```typescript
const fn = jest.fn();

// Make it return a resolved promise
fn.mockResolvedValue({ id: 1 });

// Make it return a value synchronously
fn.mockReturnValue('hello');

// Make it throw (or reject for async)
fn.mockRejectedValue(new Error('DB error'));

// Make it execute custom logic
fn.mockImplementation((arg) => {
  return { processed: arg };
});
```

**Inspecting calls afterward:**

```typescript
// Was it called?
expect(fn).toHaveBeenCalled();

// Was it called exactly once?
expect(fn).toHaveBeenCalledTimes(1);

// Was it called with these arguments?
expect(fn).toHaveBeenCalledWith(1, { title: 'Lunch' });

// What were the raw arguments of the first call?
fn.mock.calls[0][0] // first call, first argument
fn.mock.calls[0][1] // first call, second argument
```

**Real usage in the expenses test — verifying the Prisma query shape:**

```typescript
it('should apply search filter as OR on title and description', async () => {
  mockPrisma.expense.findMany.mockResolvedValue([]);
  mockPrisma.expense.count.mockResolvedValue(0);

  await service.findAll(1, { search: 'lunch' });

  // Grab what was passed to findMany
  const callArgs = mockPrisma.expense.findMany.mock.calls[0][0];
  expect(callArgs.where.OR).toEqual([
    { title: { contains: 'lunch', mode: 'insensitive' } },
    { description: { contains: 'lunch', mode: 'insensitive' } },
  ]);
});
```

This test doesn't just verify the return value — it verifies the **exact Prisma query** the service sent.
If a developer accidentally breaks the OR filter, this test will catch it.

---

## 6. Mocking an Entire Module (bcrypt)

`bcrypt` is a third-party module imported like this:

```typescript
import * as bcrypt from 'bcrypt';
// ...
const hash = await bcrypt.hash(password, 10);
```

Because it's imported as a namespace (`* as bcrypt`), you can't mock individual methods easily.
Instead, use `jest.mock('bcrypt')` at the **top of the file**, outside any test block:

```typescript
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');                               // intercepts the whole module
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>; // gives you type safety
```

From this point on, every `bcrypt.hash(...)` or `bcrypt.compare(...)` call in your service
will call the mock instead of running real bcrypt.

**Usage inside a test:**

```typescript
it('should hash the password with salt rounds 10', async () => {
  (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

  await service.changePassword(1, { currentPassword: 'old', newPassword: 'new' });

  expect(mockBcrypt.hash).toHaveBeenCalledWith('new', 10);
});
```

**Why mock bcrypt at all?**
Real bcrypt is deliberately slow (that's its security property). Mocking it keeps tests fast
and makes them deterministic — you control exactly what "hashed" looks like.

---

## 7. Mocking Prisma's $transaction

Prisma's `$transaction` takes a callback and runs it inside a database transaction:

```typescript
// Real application code
await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { ... } });
  await tx.category.createMany({ data: [...] });
  return user;
});
```

In tests, `$transaction` is a `jest.fn()`. You need to mock it so that it **actually calls** the callback
with a fake `tx` object — otherwise the code inside never runs and your assertions are meaningless.

```typescript
mockPrisma.$transaction.mockImplementation(async (cb: any) => {
  const tx = {
    user: { create: jest.fn().mockResolvedValue(mockUser) },
    category: { createMany: jest.fn().mockResolvedValue({ count: 9 }) },
  };
  return cb(tx); // execute the callback with fake tx
});
```

`mockImplementation` lets you give the mock **real behaviour** — it executes the callback `cb`
and passes the `tx` object you control.

This is how the auth register test verifies that 9 default categories are created:

```typescript
it('should create 9 default categories inside the transaction', async () => {
  const mockCreateMany = jest.fn().mockResolvedValue({ count: 9 });
  // ...
  mockPrisma.$transaction.mockImplementation(async (cb: any) => {
    const tx = {
      user: { create: jest.fn().mockResolvedValue(mockUser) },
      category: { createMany: mockCreateMany },   // capture this mock
    };
    return cb(tx);
  });

  await service.register(dto);

  // Now assert on the captured mock
  expect(mockCreateMany.mock.calls[0][0].data).toHaveLength(9);
  expect(mockCreateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({ isDefault: true }),
      ]),
    }),
  );
});
```

---

## 8. The NestJS TestingModule

`Test.createTestingModule` is the NestJS test factory. It creates a mini application
with only the classes you declare. Think of it as a stripped-down version of `AppModule`.

**Pattern for service tests (no HTTP):**

```typescript
const module = await Test.createTestingModule({
  providers: [
    RealServiceClass,
    { provide: PrismaService, useValue: mockPrisma },
    { provide: JwtService, useValue: mockJwtService },
  ],
}).compile();

service = module.get<RealServiceClass>(RealServiceClass);
```

**Pattern for controller tests (with HTTP via Supertest):**

```typescript
const module = await Test.createTestingModule({
  controllers: [RealController],
  providers: [{ provide: ServiceClass, useValue: mockService }],
})
  .overrideGuard(JwtAuthGuard)
  .useClass(MockJwtAuthGuard)
  .compile();

app = module.createNestApplication();
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
await app.init();
```

**Pattern for E2E tests (full AppModule):**

```typescript
const module = await Test.createTestingModule({
  imports: [AppModule],  // import the whole app
})
  .overrideProvider(PrismaService)
  .useValue(mockPrisma)  // swap out only the DB
  .compile();

app = module.createNestApplication();
app.setGlobalPrefix('api/v1');
app.use(cookieParser());
app.useGlobalPipes(new ValidationPipe({ ... }));
await app.init();
```

---

## 9. Testing Exceptions (rejects.toThrow)

When your service is supposed to throw an exception, use the async rejection pattern:

```typescript
it('should throw ConflictException when email already exists', async () => {
  mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'taken@example.com' });

  await expect(service.register(dto)).rejects.toThrow(ConflictException);
});
```

**Breaking this down:**
- `service.register(dto)` returns a Promise
- `expect(...)` wraps it
- `.rejects` tells Jest this Promise should reject
- `.toThrow(ConflictException)` asserts the rejection is specifically this exception type

You can also assert the message:

```typescript
await expect(service.register(dto)).rejects.toThrow('Email already in use');
```

**Verifying a mock was NOT called after an early exception:**

```typescript
it('should not call delete when category does not belong to user', async () => {
  mockPrisma.category.findFirst.mockResolvedValue(null); // not found

  await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
  expect(mockPrisma.category.delete).not.toHaveBeenCalled(); // delete was skipped
});
```

This is a safety test — it proves your guard clause stopped execution before the destructive operation.

---

## 10. Inspecting Mock Call Arguments

When you want to verify **how** a function was called (not just that it was called),
use `.mock.calls`:

```typescript
// Structure: fn.mock.calls[callIndex][argIndex]
const firstCallFirstArg = mockPrisma.expense.findMany.mock.calls[0][0];
```

**Example — testing that pagination math is correct:**

```typescript
it('should calculate correct skip for page 3, limit 10', async () => {
  await service.findAll(1, { page: 3, limit: 10 });

  const callArgs = mockPrisma.expense.findMany.mock.calls[0][0];
  expect(callArgs.skip).toBe(20); // (3 - 1) * 10 = 20
  expect(callArgs.take).toBe(10);
});
```

**Using `expect.objectContaining` for partial matches:**

```typescript
expect(mockPrisma.expense.create).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expect.objectContaining({ userId: 1, title: 'Lunch' }),
  }),
);
```

`expect.objectContaining` means "the object must have AT LEAST these keys with these values".
Extra keys in the actual call are ignored. This is useful when you don't want to enumerate
every field in a Prisma query.

---

## 11. Controller Integration Tests — How They Work

Controllers handle routing, guards, and DTO validation — none of which exist in a service test.
Controller tests use Supertest to make real HTTP requests against a real (but in-process) HTTP server.

**What is tested here that is NOT tested in service tests:**
- The `@Get()`, `@Post()`, `@Patch()`, `@Delete()` route decorators work correctly
- The `ValidationPipe` rejects bad input (400)
- The `JwtAuthGuard` blocks unauthenticated requests (401)
- The `@Body()`, `@Param()`, `@Query()` decorators extract data correctly
- The controller calls the service with the right arguments

**The service is a mock** — you're testing the HTTP layer, not the business logic.

**Full controller test structure:**

```typescript
// 1. Create fake data the mock service will return
const mockExpense = { id: 1, title: 'Lunch', amount: 15.5, ... };

// 2. Create the mock service — all methods are jest.fn()
const mockExpensesService = {
  findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
  create: jest.fn().mockResolvedValue(mockExpense),
  // ...
};

describe('ExpensesController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [{ provide: ExpensesService, useValue: mockExpensesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    jest.clearAllMocks();
    // Reset mocks here because they were initialized with values at module level
    mockExpensesService.findAll.mockResolvedValue(mockPaginatedResult);
  });

  afterEach(async () => {
    await app.close(); // clean up the HTTP server after each test
  });

  it('should return paginated expenses', async () => {
    const res = await request(app.getHttpServer()).get('/expenses');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(mockExpensesService.findAll).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
```

---

## 12. Supertest — Making Real HTTP Requests in Tests

`supertest` lets you make HTTP requests to your NestJS app without a network.
It calls the Node.js HTTP server directly in-process.

```typescript
import request from 'supertest';

// GET
const res = await request(app.getHttpServer()).get('/expenses');

// POST with body
const res = await request(app.getHttpServer())
  .post('/expenses')
  .send({ title: 'Lunch', amount: 15.5, categoryId: 1, date: '2026-04-01' });

// PATCH with body
const res = await request(app.getHttpServer())
  .patch('/expenses/1')
  .send({ title: 'Dinner' });

// DELETE
const res = await request(app.getHttpServer()).delete('/expenses/1');

// With auth header
const res = await request(app.getHttpServer())
  .post('/auth/logout')
  .set('Authorization', `Bearer ${accessToken}`);

// With query params
const res = await request(app.getHttpServer())
  .get('/expenses')
  .query({ search: 'lunch', page: '2', limit: '10' });
```

**Asserting on the response:**

```typescript
expect(res.status).toBe(200);         // HTTP status code
expect(res.body).toHaveProperty('data');   // body is parsed JSON
expect(res.body.data.id).toBe(1);
expect(res.body.data).not.toHaveProperty('password');
```

---

## 13. Mocking Guards (JWT Auth)

`JwtAuthGuard` in the real app verifies a Bearer token from the `Authorization` header.
In controller tests, you don't want to deal with real JWT secrets — you want the guard to
always pass (or always fail) so you can test other things.

**How `overrideGuard` works:**

```typescript
const module = await Test.createTestingModule({ ... })
  .overrideGuard(JwtAuthGuard)   // "when this guard is applied on a route..."
  .useClass(MockJwtAuthGuard)    // "...use this class instead"
  .compile();
```

NestJS sees `@UseGuards(JwtAuthGuard)` on the route, but replaces the real guard with your mock.

**Always-pass mock (used in most controller tests):**

```typescript
class MockJwtAuthGuard {
  canActivate() {
    return true; // let every request through
  }
}
```

**Always-reject mock (used to test 401 behaviour):**

```typescript
class RejectAllGuard {
  canActivate() {
    return false; // block every request → NestJS returns 403 (or 401 if configured)
  }
}
```

The `ExpensesController` tests use a helper function `buildApp(guardClass)` to switch
between the two guards per test:

```typescript
const buildApp = async (guardClass = MockJwtAuthGuard) => {
  const module = await Test.createTestingModule({ ... })
    .overrideGuard(JwtAuthGuard)
    .useClass(guardClass)
    .compile();
  // ...
};
```

---

## 14. Injecting a Fake User via Guards

Most protected routes read the current user from `req.user`.
In a real request, `JwtAuthGuard` calls `validate()` on the JWT strategy which sets `req.user`.
In tests, the mock guard must do this manually:

```typescript
class MockJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 1 };  // inject fake user
    return true;
  }
}
```

`context.switchToHttp().getRequest()` gets the raw Express `req` object.
Setting `req.user = { id: 1 }` means the controller's `@Request() req` will have `req.user.id === 1`.

This is why controller tests can assert that the service was called with userId 1:

```typescript
expect(mockExpensesService.findAll).toHaveBeenCalledWith(1, expect.any(Object));
//                                                        ^ this comes from req.user.id
```

---

## 15. Testing ValidationPipe (DTOs)

`ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` does three things:
- **whitelist**: strips properties not in the DTO
- **forbidNonWhitelisted**: returns 400 if unknown properties are sent
- **transform**: converts primitives (e.g. turns `"1"` string from query into `1` number)

To test DTO validation in controller tests, apply `ValidationPipe` to the test app:

```typescript
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
);
```

Now you can send bad data and assert 400:

```typescript
it('should return 400 when amount is negative', async () => {
  const res = await request(app.getHttpServer())
    .post('/expenses')
    .send({ title: 'Lunch', amount: -10, categoryId: 1, date: '2026-04-01' });

  expect(res.status).toBe(400);
});

it('should return 400 when unknown field is sent', async () => {
  const res = await request(app.getHttpServer())
    .patch('/users/me')
    .send({ firstName: 'Jane', unknownField: 'value' });

  expect(res.status).toBe(400);
});
```

The 400 is thrown by `ValidationPipe` **before** the controller method runs,
which means the mock service is never called. You can verify this:

```typescript
expect(mockService.updateProfile).not.toHaveBeenCalled();
```

---

## 16. E2E Tests — How They Work

E2E tests load the **entire AppModule** but replace **only PrismaService** with a mock.
This tests that all the wiring between modules (guards, interceptors, filters, pipes, controllers, services)
works correctly together — without touching a real database.

```typescript
// test/auth.e2e-spec.ts

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  category: { findMany: jest.fn().mockResolvedValue([]), createMany: jest.fn() },
  expense: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn(), ... },
  income: { ... },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .compile();

  app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');    // same as production app
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ ... }));
  await app.init();
});
```

**Why `beforeAll` instead of `beforeEach`?**
Starting a full NestJS app is expensive (~500ms). For E2E tests, start once and reuse across all tests.
For unit tests, `beforeEach` is fine because creating a `TestingModule` with 2-3 providers is instant.

**Real JWT tokens in E2E:**
Unlike controller tests (which mock the guard), E2E tests use the real `JwtAuthGuard` and real `JwtService`.
This means you need a real, signed token:

```typescript
it('should access protected route with valid token', async () => {
  // First, actually log in to get a real token
  const loginRes = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: 'e2e@example.com', password: 'password123' });

  const accessToken = loginRes.body.data.accessToken;

  // Now use that real token
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`);

  expect(res.status).toBe(200);
});
```

---

## 17. Test Structure Patterns (beforeEach, afterEach)

**The reset-before-each pattern:**

```typescript
const mockService = {
  findAll: jest.fn().mockResolvedValue(mockData),  // initial value for type inference
};

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set mock return values because clearAllMocks wipes them
  mockService.findAll.mockResolvedValue(mockData);
});
```

`jest.clearAllMocks()` resets:
- `.mock.calls` (call history)
- `.mock.instances`
- `.mock.results`
- Return values set via `mockReturnValue` / `mockResolvedValue`

That last point is why you need to re-set return values after clearing.
Alternatively, use `jest.resetAllMocks()` only if you want to also remove `mockImplementation`.

**Closing the app after each test:**

```typescript
afterEach(async () => {
  await app.close();
});
```

This is critical for controller tests. Without it, the HTTP server stays open,
and the next test creates a second server — they'll compete for the same port and
you'll get `EADDRINUSE` errors.

For E2E tests (where `beforeAll` is used), close in `afterAll`:

```typescript
afterAll(async () => {
  await app.close();
});
```

---

## 18. Common Matchers Reference

```typescript
// Equality
expect(value).toBe(42);               // strict equality (===)
expect(object).toEqual({ a: 1 });     // deep equality (works for objects/arrays)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(n).toBeGreaterThan(0);
expect(n).toBeLessThan(100);
expect(n).toBeInstanceOf(Date);

// Strings
expect(str).toContain('Password updated');
expect(str).toMatch(/^\d{4}-\d{2}$/);   // regex

// Arrays
expect(arr).toHaveLength(3);
expect(arr).toContain(item);

// Objects
expect(obj).toHaveProperty('email');
expect(obj).toHaveProperty('email', 'test@example.com');
expect(obj).not.toHaveProperty('password');

// Partial matching (ignores extra keys)
expect(obj).toMatchObject({ userId: 1, title: 'Lunch' });
expect.objectContaining({ userId: 1 })   // use inside toHaveBeenCalledWith
expect.arrayContaining([{ isDefault: true }])

// Mock-specific
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(1);
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).not.toHaveBeenCalled();

// Async exceptions
await expect(promise).rejects.toThrow(SomeException);
await expect(promise).rejects.toThrow('error message');
```

---

## 19. Patterns to Avoid

**Don't put `jest.clearAllMocks()` in `afterEach` — put it in `beforeEach`.**
If a test throws before completing, `afterEach` may still run and clear state from the failed test.
Clearing in `beforeEach` guarantees a clean slate before each test regardless of what the previous test did.

**Don't test implementation if you can test the contract.**
A bad test:
```typescript
// Bad: tests internal method call order
expect(prisma.user.findUnique).toHaveBeenCalledBefore(prisma.user.update);
```
A good test:
```typescript
// Good: tests the observable output
expect(result.firstName).toBe('Jane');
```

**Don't reuse the same mock object across tests without resetting.**
If test A sets `mockFn.mockResolvedValue(x)` and test B doesn't override it,
test B is silently depending on test A's setup. Always reset in `beforeEach`.

**Don't write tests that test the mock, not the code.**
```typescript
// Bad: this only tests that jest.fn() works
mockPrisma.expense.findMany.mockResolvedValue([mockExpense]);
const result = await mockPrisma.expense.findMany();
expect(result).toEqual([mockExpense]);
```
The test must call the **real service** and assert on its output.

---

## 20. How to Run the Tests

```bash
cd backend

# Run all unit/integration tests (*.spec.ts files in src/)
npm run test

# Run tests in watch mode (re-runs on file change)
npm run test:watch

# Run a specific file
npx jest src/auth/auth.service.spec.ts

# Run E2E tests (test/ directory)
npm run test:e2e

# Run with coverage report
npm run test:cov
```

Coverage output will appear in `backend/coverage/lcov-report/index.html`.
Open it in a browser to see which lines are covered and which are not.

---

## Quick Summary: What Happens in Each Test Type

```
Service test:
  Real service class
  ↓ calls
  Fake PrismaService (jest.fn()) ← you control what it returns
  ↓
  Assert output / assert Prisma was called with right args

Controller test:
  HTTP request (Supertest)
  ↓ hits
  Real Controller (routing, decorators)
  ↓ passes through
  Fake JwtAuthGuard (injects req.user)
  ↓ passes through
  Real ValidationPipe (rejects bad DTOs)
  ↓ calls
  Fake Service (jest.fn()) ← you control what it returns
  ↓
  Assert HTTP status / response body / service was called with right args

E2E test:
  HTTP request (Supertest)
  ↓ hits
  Real NestJS app (all modules, guards, pipes, interceptors)
  ↓ calls
  Fake PrismaService (jest.fn()) ← only the DB is replaced
  ↓
  Assert HTTP status / response shape / full request lifecycle
```
