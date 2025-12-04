import { TestBed } from '@angular/core/testing';

import { IsCompanyGuard } from './is-company.guard';

describe('IsCompanyGuard', () => {
  let guard: IsCompanyGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(IsCompanyGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
