// src/auth/auth.controller.ts
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';

class RegisterParentDto {
  name: string;
  email: string;
  password: string;
}

class RegisterChildDto {
  parentId: string;
  name: string;
  email: string;
  password: string;
  birthDate: Date;
}

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/parent')
  async registerParent(@Body(ValidationPipe) registerDto: RegisterParentDto) {
    return this.authService.registerParent(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );
  }

  @Post('register/child')
  async registerChild(@Body(ValidationPipe) registerDto: RegisterChildDto) {
    return this.authService.registerChild(
      registerDto.parentId,
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.birthDate,
    );
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}