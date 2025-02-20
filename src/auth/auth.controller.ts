import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { Response } from 'express';

@Controller('auth') // route
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() //Không muốn check JWT thì dùng Public
  @UseGuards(LocalAuthGuard) // người dùng phải gửi đúng username và password
  @ResponseMessage('Login success')
  @Post('/login')
  handleLogin(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @ResponseMessage('Register a new user')
  @Post('/register')
  handleRegister(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }
}
