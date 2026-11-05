import { Controller, Get } from "@nestjs/common";
@Controller("health")
export class HealthController {
  @Get() health() {
    return {
      status: "ok",
      service: "fitness-360-api",
      timestamp: new Date().toISOString(),
    };
  }
}
