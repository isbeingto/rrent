import { IsInt, IsString, Min, Length } from "class-validator";

export class CreateDemoDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsInt()
  @Min(1)
  age!: number;
}
