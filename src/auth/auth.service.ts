import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';
import ms from 'ms';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  //username/ pass là 2 tham số thư viện passport nó ném về
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUserName(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser, response: Response) {
    const { _id, name, email, role } = user;
    const payload = {
      sub: 'token login', //Nội dung token
      iss: 'from server', //Người tạo ra token
      _id,
      name,
      email,
      role,
    };

    const refresh_token = this.createRefreshToken(payload);

    //update user with refresh token vao database
    await this.usersService.updateUserToken(refresh_token, _id);

    //set refresh_token as cookie
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true, // chỉ có server mới có thể đọc được
      maxAge: ms(this.configService.get<string>('JWT_ACCESS_EXPIRED')),
    });

    //Tạo ra token
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
      },
    };
  }

  //TẠO MỚI REFRESH TOKEN
  createRefreshToken = (payload: any) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRED')) / 1000,
    });
    return refresh_token;
  };

  async register(user: RegisterUserDto) {
    let newUser = await this.usersService.register(user);

    return {
      //Phan hoi ve client
      _id: newUser?.id,
      createdAt: newUser.createdAt,
    };
  }
}
