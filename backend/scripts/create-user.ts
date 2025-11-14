import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { UserService } from "../src/modules/user/user.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { OrgRole } from "@prisma/client";
import * as crypto from "crypto";

/**
 * 管理员用户创建脚本
 * 用法: npx ts-node scripts/create-user.ts --email user@example.com --role PROPERTY_MGR --org-code ORG001 [--password mypassword] [--full-name "Full Name"]
 */
async function bootstrap() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const params = new Map<string, string>();

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) {
      params.set(key, value);
    }
  }

  // 验证必需参数
  const email = params.get("email");
  const roleStr = params.get("role");
  const orgCode = params.get("org-code");

  if (!email || !roleStr || !orgCode) {
    console.error(
      "缺少必需参数。用法: npx ts-node scripts/create-user.ts --email user@example.com --role PROPERTY_MGR --org-code ORG001 [--password password] [--full-name \"Full Name\"]",
    );
    console.error("\n可用角色: OWNER, PROPERTY_MGR, OPERATOR, STAFF");
    process.exit(1);
  }

  // 验证角色
  const validRoles = Object.values(OrgRole);
  if (!validRoles.includes(roleStr as OrgRole)) {
    console.error(`无效的角色: ${roleStr}`);
    console.error(`可用角色: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  const role = roleStr as OrgRole;
  const password =
    params.get("password") || generateRandomPassword(16);
  const fullName = params.get("full-name") || email.split("@")[0];

  try {
    // 创建 NestJS 应用上下文
    const app = await NestFactory.create(AppModule, { logger: ["error"] });
    const userService = app.get(UserService);
    const prismaService = app.get(PrismaService);

    // 通过组织代码查找组织
    console.log(`正在查找组织: ${orgCode}`);
    const organization = await prismaService.organization.findUnique({
      where: { code: orgCode },
    });

    if (!organization) {
      console.error(`错误: 找不到组织代码 "${orgCode}"`);
      process.exit(1);
    }

    console.log(`✓ 找到组织: ${organization.name} (${organization.id})`);

    // 检查用户是否已存在
    const existingUser = await prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`错误: 邮箱 "${email}" 已被使用`);
      process.exit(1);
    }

    // 创建用户
    console.log(`正在创建用户: ${email}`);
    const user = await userService.create({
      email,
      password,
      fullName,
      role,
      organizationId: organization.id,
      isActive: true,
    });

    console.log("\n✓ 用户创建成功!\n");
    console.log("用户信息:");
    console.log(`  邮箱:      ${user.email}`);
    console.log(`  名称:      ${user.fullName}`);
    console.log(`  角色:      ${user.role}`);
    console.log(`  组织:      ${organization.name}`);
    console.log(`  状态:      ${user.isActive ? "活跃" : "已禁用"}`);
    console.log(`  创建时间:  ${user.createdAt}`);
    console.log(`\n密码: ${password}`);
    console.log(
      "\n⚠️  请将密码保存在安全的地方。首次登录时，用户可以修改密码。\n",
    );

    await app.close();
  } catch (error) {
    console.error("创建用户时出错:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * 生成随机密码
 * @param length 密码长度
 * @returns 随机密码字符串
 */
function generateRandomPassword(length: number): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

bootstrap();
