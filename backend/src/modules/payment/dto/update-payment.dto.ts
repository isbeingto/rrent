import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreatePaymentDto } from "./create-payment.dto";

export class UpdatePaymentDto extends PartialType(
  OmitType(CreatePaymentDto, [
    "organizationId",
    "leaseId",
    "amount",
    "currency",
    "dueDate",
  ] as const),
) {}
