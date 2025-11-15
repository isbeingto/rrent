import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check - returns 200 if service is running
   * Used by load balancers and simple health checks
   */
  @Get()
  async getHealth() {
    return this.healthService.getBasicHealth();
  }

  /**
   * Readiness probe - checks if service is ready to accept traffic
   * Includes database connection check
   */
  @Get("ready")
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  /**
   * Liveness probe - checks if service is alive
   * Should return quickly to avoid restart loops
   */
  @Get("live")
  async getLiveness() {
    return this.healthService.getLiveness();
  }
}
