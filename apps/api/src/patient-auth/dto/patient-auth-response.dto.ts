import { ApiProperty } from '@nestjs/swagger';

export class PatientProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() practiceId: string;
  @ApiProperty({ nullable: true }) treatmentType: string | null;
  @ApiProperty({ nullable: true }) alignerBrand: string | null;
  @ApiProperty() currentStage: number;
  @ApiProperty({ nullable: true }) totalStages: number | null;
  @ApiProperty() scanFrequency: number;
  @ApiProperty() status: string;
}

export class PatientAuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ type: PatientProfileDto }) patient: PatientProfileDto;
}
