import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  practiceId: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
