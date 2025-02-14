import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
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
  @IsString({ message: 'Name must be text' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Email address of the person submitting the contact form',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Message content',
    example: 'I would like to inquire about...',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString({ message: 'Message must be text' })
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  message: string;
}
