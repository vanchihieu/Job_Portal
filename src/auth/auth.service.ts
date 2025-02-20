import { BadRequestException, Injectable } from '@nestjs/common';
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

  /**
   * 1. Server lấy ra refresh_token từ cookies 
   * 2. - Server check (verify) để biết refresh_token có hợp lệ hay không ?
   * 3. - Server query database theo refresh_token  
      => lấy thông tin user  
      => issue access_token mới 
    4. - Server trả ra phản hồi (set cookies ứng với refresh_token mới) 
   * @param refreshToken 
   */
  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      let user = await this.usersService.findUserByToken(refreshToken);

      if (user) {
        const { _id, name, email, role } = user;
        const payload = {
          sub: 'token refresh', //Nội dung token
          iss: 'from server', //Người tạo ra token
          _id,
          name,
          email,
          role,
        };
        const refresh_token = this.createRefreshToken(payload);
        
        //update user with refresh token vao database
        await this.usersService.updateUserToken(refresh_token, _id.toString());

        //set refresh_token as cookie
        response.clearCookie('refresh_token');
        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('JWT_ACCESS_EXPIRED')),
        });
        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            name,
            email,
            role,
          },
        };
      } else {
        throw new BadRequestException(
          `Refresh token không hợp lệ. Vui lòng login.`,
        );
      }
    } catch (error) {
      throw new BadRequestException(
        `Refresh token không hợp lệ. Vui lòng login.`,
      );
    }
  };
}
