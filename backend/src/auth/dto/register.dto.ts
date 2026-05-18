import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MinLength(2)
    firstName: string;

    @IsString()
    @MinLength(2)
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    @MinLength(9)
    phone?: string;
}