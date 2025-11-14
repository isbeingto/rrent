import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateTenantDto } from "./create-tenant.dto";

export class UpdateTenantDto extends PartialType(
  OmitType(CreateTenantDto, ["organizationId"] as const),
) {}
