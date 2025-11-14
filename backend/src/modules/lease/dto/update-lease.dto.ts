import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateLeaseDto } from "./create-lease.dto";

export class UpdateLeaseDto extends PartialType(
  OmitType(CreateLeaseDto, [
    "organizationId",
    "propertyId",
    "unitId",
    "tenantId",
  ] as const),
) {}
