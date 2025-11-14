import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { User, Prisma } from "@prisma/client";
import { BcryptPasswordHasher } from "../../common/security/password-hasher";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { Paginated, createPaginatedResult } from "../../common/pagination";
import {
  OrganizationNotFoundException,
  UserNotFoundException,
} from "../../common/errors/not-found.exception";
import { UserEmailConflictException } from "../../common/errors/conflict.exception";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: BcryptPasswordHasher,
  ) {}

  /**
   * 创建用户
   * 强制哈希密码，不允许明文存储
   * @param dto 创建用户数据
   * @returns 创建后的用户信息（不包含 passwordHash）
   */
  async create(dto: CreateUserDto): Promise<Omit<User, "passwordHash">> {
    // 验证 organizationId 对应的组织是否存在
    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new OrganizationNotFoundException(dto.organizationId);
    }

    // 哈希密码
    const passwordHash = await this.passwordHasher.hash(dto.password);

    try {
      // 创建用户，只保存 passwordHash，不保存明文 password
      const user = await this.prisma.user.create({
        data: {
          organizationId: dto.organizationId,
          email: dto.email,
          passwordHash, // 使用哈希后的密码
          fullName: dto.fullName,
          role: dto.role,
          isActive: dto.isActive ?? true,
        },
      });

      // 返回用户信息，排除 passwordHash
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // P2002: Unique constraint failed
        throw new UserEmailConflictException(dto.email);
      }
      throw error;
    }
  }

  /**
   * 按 ID 和 organizationId 查找用户
   * 强制 org-scoped 访问
   * @param id 用户 ID
   * @param organizationId 组织 ID
   * @returns 用户信息（不包含 passwordHash）
   */
  async findById(
    id: string,
    organizationId: string,
  ): Promise<Omit<User, "passwordHash">> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!user) {
      throw new UserNotFoundException(id);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 按 email 和 organizationId 查找用户
   * 用于认证流程，返回完整用户信息（包含 passwordHash 用于验证）
   * @param email 邮箱
   * @param organizationId 组织 ID
   * @returns 完整用户信息（包含 passwordHash）或 null
   */
  async findByEmail(
    email: string,
    organizationId: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        organizationId,
      },
    });
  }

  /**
   * 分页查询用户
   * @param query 查询条件
   * @returns 分页结果
   */
  async findMany(
    query: QueryUserDto,
  ): Promise<Paginated<Omit<User, "passwordHash">>> {
    const {
      page = 1,
      limit = 20,
      organizationId,
      keyword,
      role,
      isActive,
    } = query;

    // 构建 where 条件
    const where: Prisma.UserWhereInput = {
      organizationId, // 强制 org-scoped
    };

    if (keyword) {
      where.OR = [
        { fullName: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (role !== undefined) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // 查询
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          organizationId: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 类型转换（已排除 passwordHash）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsWithoutPassword = items as any as Omit<User, "passwordHash">[];

    return createPaginatedResult(itemsWithoutPassword, total, page, limit);
  }

  /**
   * 更新用户
   * 不允许通过此方法更新密码
   * @param id 用户 ID
   * @param organizationId 组织 ID
   * @param dto 更新数据
   * @returns 更新后的用户信息（不包含 passwordHash）
   */
  async update(
    id: string,
    organizationId: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, "passwordHash">> {
    // 验证用户存在且属于该组织
    await this.findById(id, organizationId);

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          role: dto.role,
          isActive: dto.isActive,
          // 注意：password 不在此处理，防止误覆盖
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new UserEmailConflictException(
          (error.meta?.["cause"] as string) || "unknown",
        );
      }
      throw error;
    }
  }

  /**
   * 删除用户
   * @param id 用户 ID
   * @param organizationId 组织 ID
   */
  async remove(id: string, organizationId: string): Promise<void> {
    // 验证用户存在且属于该组织
    await this.findById(id, organizationId);

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
