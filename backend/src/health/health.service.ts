import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  environment: string;
  version?: string;
}

interface ReadinessStatus extends HealthStatus {
  database: {
    connected: boolean;
    responseTime?: number;
  };
  checks: {
    database: boolean;
  };
}

@Injectable()
export class HealthService {
  private readonly startTime: number;

  constructor(private readonly prisma: PrismaService) {
    this.startTime = Date.now();
  }

  /**
   * Basic health check - returns minimal information
   * Fast response, no external dependencies checked
   */
  getBasicHealth(): HealthStatus {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION || "1.0.0",
    };
  }

  /**
   * Readiness probe - checks if service is ready to accept traffic
   * Includes database connectivity check
   */
  async getReadiness(): Promise<ReadinessStatus> {
    const dbCheck = await this.checkDatabase();

    if (!dbCheck.connected) {
      throw new ServiceUnavailableException({
        status: "error",
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        environment: process.env.NODE_ENV || "development",
        database: dbCheck,
        checks: {
          database: false,
        },
        message: "Service not ready - database connection failed",
      });
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION || "1.0.0",
      database: dbCheck,
      checks: {
        database: dbCheck.connected,
      },
    };
  }

  /**
   * Liveness probe - checks if service is alive
   * Should be fast and not check external dependencies
   */
  getLiveness(): HealthStatus {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: process.env.NODE_ENV || "development",
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{
    connected: boolean;
    responseTime?: number;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        responseTime,
      };
    } catch (error) {
      return {
        connected: false,
      };
    }
  }

  /**
   * Get service uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
