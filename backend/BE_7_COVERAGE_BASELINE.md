# BE-7 Coverage Baseline Report

**Date**: 2025-06-XX  
**Task**: BE-7-64 Coverage Threshold Configuration  
**Baseline Command**: `NODE_ENV=test pnpm exec jest --coverage`

## 📊 Current Coverage Metrics

| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| **Statements** | 74.08% | ≥70% | ✅ PASS |
| **Branches** | 39.66% | ≥70% | ❌ FAIL |
| **Functions** | 53.84% | ≥70% | ❌ FAIL |
| **Lines** | 72.36% | ≥70% | ✅ PASS |

## 🎯 Gap Analysis

### Critical Gaps (Need Improvement)

1. **Branches**: 39.66% → Need +30.34% improvement
   - Primary concern: Conditional logic and error handling paths
   
2. **Functions**: 53.84% → Need +16.16% improvement
   - Many utility and service methods not covered

### Already Passing

- ✅ Statements: 74.08% (exceeds 70%)
- ✅ Lines: 72.36% (exceeds 70%)

## 📁 Module-Level Coverage Analysis

### Low Coverage Modules (<70%)

#### **src/modules/tenant** - 68.47% statements, 40% branches
- **tenant.service.ts**: 54.38% statements, 40% branches, 50% functions
- **tenant.controller.ts**: 88.88% statements, 50% functions
- **Priority**: MEDIUM

#### **src/modules/unit** - 45.55% statements
- **unit.service.ts**: 23.63% statements, 3.84% branches, 28.57% functions
- **update-unit.dto.ts**: 90.69% statements, 50% functions
- **Priority**: HIGH - Critical for property management

#### **src/common/errors** - 74.5% statements, 30% branches
- **validation.exception.ts**: 0% coverage
- **forbidden.exception.ts**: 63.63% statements, 0% branches
- **conflict.exception.ts**: 58.82% statements, 0% functions
- **not-found.exception.ts**: 73.68% statements, 37.5% functions
- **Priority**: MEDIUM - Error handling paths

#### **src/modules/organization** - 67.53% statements, 36.84% branches
- **organization.service.ts**: 59.52% statements, 36.84% branches, 33.33% functions
- **organization.controller.ts**: 70.37% statements, 16.66% functions
- **Priority**: MEDIUM

#### **src/modules/property** - 63.95% statements, 21.73% branches
- **property.service.ts**: 52.94% statements, 21.73% branches, 50% functions
- **property.controller.ts**: 74.07% statements, 33.33% functions
- **Priority**: MEDIUM

#### **src/modules/payment** - 69.60% statements, 33.33% branches
- **payment.service.ts**: 56.45% statements, 34.48% branches, 42.85% functions
- **payment.controller.ts**: 87.09% statements, 0% branches, 42.85% functions
- **Priority**: MEDIUM - Business-critical payment logic

#### **src/common/filters** - 54.83% statements, 17.39% branches
- **http-exception.filter.ts**: 54.83% statements, 17.39% branches
- **Priority**: MEDIUM - Error handling logic

#### **src/modules/lease** - 75.16% statements, 38% branches
- **lease.service.ts**: 72.47% statements, 38.29% branches
- **activate-lease-result.dto.ts**: 0% coverage
- **Priority**: LOW - Already close to target, but branches need work

#### **src/modules/auth** - 90.27% statements, 44.44% branches
- **auth.service.ts**: 84.61% statements, 40% branches, 60% functions
- **login.dto.ts**: 0% coverage (but minimal impact)
- **Priority**: LOW - Already high coverage

### High Coverage Modules (≥90%)

- ✅ **src/common**: 96.66% statements, 95.55% branches
- ✅ **src/common/interceptors**: 100% coverage
- ✅ **src/common/security**: 100% coverage
- ✅ **src/common/decorators**: 100% coverage
- ✅ **src/demo**: 100% coverage
- ✅ **src/health**: 100% coverage
- ✅ **src/modules/auth/guards**: 91.30% statements, 80% branches

## 🔧 Recommended Actions

### Phase 1: Quick Wins (Target Branches ≥70%)

1. **Add unit tests for unit.service.ts** (currently 3.84% branches):
   - findAll filtering logic (isAvailable checks)
   - checkAvailability date range validations
   - Error paths for not found scenarios
   - CRUD operation branches

2. **Add error path tests** for `src/common/errors/*`:
   - ValidationException scenarios
   - ForbiddenException branches
   - ConflictException branches  
   - NotFoundExceptions function coverage

3. **Add tests for http-exception.filter.ts** (currently 17.39% branches):
   - Different exception type handling
   - Error code mapping logic
   - Response formatting branches

4. **Add conditional logic tests** for services:
   - payment.service.ts: markPaid error paths, status transitions
   - lease.service.ts: activation flow branches, validation paths
   - tenant.service.ts: filtering logic branches

### Phase 2: Function Coverage (Target ≥70%)

3. **Create unit tests** for uncovered service functions:
   - UnitService CRUD methods and availability checks
   - PaymentService markPaid and status updates
   - PropertyService filtering logic
   - OrganizationService create/update/delete
   - TenantService query parsing and filtering

### Phase 3: Integration (Validate Overall)

4. **Run coverage with threshold enforcement**:
   - Configure jest.config.js with 70% thresholds
   - Verify all four metrics pass
   - Document final coverage report

## 📈 Success Criteria

- [x] Statements ≥ 70% (currently 74.08%)
- [ ] Branches ≥ 70% (currently 39.66%, need +30.34%)
- [ ] Functions ≥ 70% (currently 53.84%, need +16.16%)
- [x] Lines ≥ 70% (currently 72.36%)

## 🐛 Known Issues

- ~~pagination.e2e-spec.ts has foreign key constraint error during test setup~~ ✅ FIXED
- All pagination tests now passing (45/45)
- 56 other test failures affecting overall test suite (not blocking coverage collection)

## 📝 Next Steps

1. ~~Fix pagination.e2e-spec.ts foreign key constraint error~~ ✅ DONE
2. Configure jest.config.js with coverageThreshold
3. Create unit tests for unit.service.ts (highest priority - 3.84% branches)
4. Add error path tests for common/errors/* and http-exception.filter.ts
5. Create unit tests for payment.service.ts and tenant.service.ts
6. Re-run coverage and validate all metrics ≥70%
7. Create BE_7_COVERAGE_THRESHOLD.md with final report
