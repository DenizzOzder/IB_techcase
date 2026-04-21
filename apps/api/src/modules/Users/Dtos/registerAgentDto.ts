import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { IRegisterAgentRequest } from '@repo/types';

export class RegisterAgentDto implements IRegisterAgentRequest {
  @IsString()
  @IsNotEmpty({ message: 'İsim boş bırakılamaz.' })
  name: string;

  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz.' })
  @IsNotEmpty({ message: 'Email boş bırakılamaz.' })
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
  password?: string;
}
