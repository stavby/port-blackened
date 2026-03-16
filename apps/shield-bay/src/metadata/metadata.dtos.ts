import { ApiProperty } from "@nestjs/swagger";

export class TableSchemaDef {
  @ApiProperty()
  col_name!: string;

  @ApiProperty()
  col_type!: string;
}
