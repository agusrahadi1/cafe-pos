import { IsString, IsOptional, IsNumber, Min, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RecipeItemInputDto {
  @ApiProperty({ description: 'ID Ingredient' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: 18, description: 'Jumlah takaran bahan' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Transform(({ value }) => parseFloat(value))
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'ID UnitOfMeasure (opsional, default ke unit ingredient)', required: false })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiProperty({ example: 'Takaran standar double shot', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaveRecipeDto {
  @ApiProperty({ description: 'ID Product yang memiliki resep ini' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'ID ProductVariant (opsional jika resep khusus varian)', required: false })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ description: 'ID ModifierOption (opsional jika resep untuk modifier)', required: false })
  @IsOptional()
  @IsUUID()
  modifierOptionId?: string;

  @ApiProperty({ type: [RecipeItemInputDto], description: 'Daftar bahan baku dalam resep' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  items: RecipeItemInputDto[];
}

