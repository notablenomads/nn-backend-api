import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface IContactFormData {
  name: string;
  email: string;
  message: string;
}

export class ContactFormDto implements IContactFormData {
  @ApiProperty({
    description: 'Name of the person submitting the contact form',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email address of the person submitting the contact form',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Message content',
    example: 'I would like to inquire about...',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;
}
