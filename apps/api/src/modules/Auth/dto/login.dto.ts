import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ILoginRequest } from '@repo/types';

export class LoginDto implements ILoginRequest {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz.' })
  @IsNotEmpty({ message: 'Email boş bırakılamaz.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre boş bırakılamaz.' })
  password?: string;
}
