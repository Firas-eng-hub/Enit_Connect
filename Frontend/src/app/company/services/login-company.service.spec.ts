import { TestBed } from '@angular/core/testing';

import { LoginCompanyService } from './login-company.service';

describe('LoginCompanyService', () => {
  let service: LoginCompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoginCompanyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
