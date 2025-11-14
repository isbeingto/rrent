import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

/**
 * 密码哈希接口
 * 定义密码处理的标准契约
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

/**
 * Bcrypt 密码哈希实现
 * 使用 bcrypt 进行密码安全存储和验证
 */
@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  /**
   * 盐轮数，控制哈希的计算成本
   * 默认为 10，可通过环境变量 BCRYPT_ROUNDS 覆盖
   */
  private readonly rounds: number = parseInt(
    process.env.BCRYPT_ROUNDS || "10",
    10,
  );

  /**
   * 哈希密码
   * @param password 明文密码
   * @returns 哈希后的密码（用于存储）
   */
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.rounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * 比对密码
   * @param password 用户输入的明文密码
   * @param hash 存储在数据库中的哈希值
   * @returns 是否匹配
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
