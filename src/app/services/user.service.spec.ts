import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { UserService, RequestConfig } from './user.service';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUsers: User[] = [
    {
      id: 1,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg'
    },
    {
      id: 2,
      email: 'emma.wong@reqres.in',
      first_name: 'Emma',
      last_name: 'Wong',
      avatar: 'https://reqres.in/img/faces/3-image.jpg'
    }
  ];

  const mockApiResponse: ApiResponse<User[]> = {
    page: 1,
    per_page: 6,
    total: 12,
    total_pages: 2,
    data: mockUsers
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should return users array on successful API call', (done) => {
      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne('https://reqres.in/api/users');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('x-api-key')).toBe('reqres-free-v1');
      req.flush(mockApiResponse);
    });




  });

  describe('postUser', () => {
    const userPayload = { name: 'John Doe', job: 'Developer' };
    const createdUser: User = {
      id: 3,
      email: 'john.doe@test.com',
      first_name: 'John',
      last_name: 'Doe',
      avatar: 'https://test.com/avatar.jpg'
    };

    it('should create user successfully', (done) => {
      service.postUser(userPayload).subscribe(user => {
        expect(user).toEqual(createdUser);
        done();
      });

      const req = httpMock.expectOne('https://reqres.in/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userPayload);
      req.flush(createdUser);
    });

  });

  describe('getUserById', () => {
    const userId = 1;
    const mockUser = mockUsers[0];
    const mockSingleUserResponse: ApiResponse<User> = {
      data: mockUser
    };

    it('should return user by ID successfully', (done) => {
      service.getUserById(userId).subscribe(user => {
        expect(user).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`https://reqres.in/api/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSingleUserResponse);
    });

  });

  describe('configuration options', () => {

    it('should use custom headers', (done) => {
      const config: RequestConfig = { 
        headers: { 'Custom-Header': 'test-value' }
      };

      service.getUsers(config).subscribe(users => {
        expect(users).toEqual(mockUsers);
        done();
      });

      const req = httpMock.expectOne('https://reqres.in/api/users');
      expect(req.request.headers.get('Custom-Header')).toBe('test-value');
      req.flush(mockApiResponse);
    });
  });
});
