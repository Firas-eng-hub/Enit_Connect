import { TestBed } from '@angular/core/testing';

import { IsVisitorGuard } from './is-visitor.guard';

describe('IsVisitorGuard', () => {
  let guard: IsVisitorGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(IsVisitorGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
