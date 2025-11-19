import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { AuditLogService } from "./audit-log.service";
import { QueryAuditLogDto } from "./dto/query-audit-log.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrgRole } from "@prisma/client";
import { parseListQuery } from "../../common/query-parser";

/**
 * 审计日志控制器
 * 提供审计日志查询接口
 */
@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * 查询审计日志列表
   * 支持按组织、实体类型、实体ID过滤
   * 默认按创建时间倒序排列
   */
  @Get()
  @Roles(OrgRole.OWNER, OrgRole.PROPERTY_MGR, OrgRole.OPERATOR, OrgRole.STAFF)
  async findAll(
    @Query() query: QueryAuditLogDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const listQuery = parseListQuery(
      query as unknown as Record<string, unknown>,
    );
    const result = await this.auditLogService.findMany(listQuery, query);
    res.setHeader("X-Total-Count", result.meta.total.toString());
    return result;
  }
}
