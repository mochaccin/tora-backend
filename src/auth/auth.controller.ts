// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

class RegisterParentDto {
  name: string;
  email: string;
  password: string;
  phone: string;
}

class RegisterChildDto {
  parentId: string;
  name: string;
  email: string;
  password: string;
  age: number;
  grade: string;
}

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/parent')
  async registerParent(@Body() registerDto: RegisterParentDto) {
    return this.authService.registerParent(registerDto);
  }

  @Post('register/child')
  async registerChild(@Body() registerDto: RegisterChildDto) {
    return this.authService.registerChild(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}