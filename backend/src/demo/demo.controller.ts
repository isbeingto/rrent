import { Body, Controller, Post } from "@nestjs/common";
import { CreateDemoDto } from "./dto/create-demo.dto";

@Controller("demo")
export class DemoController {
  @Post()
  create(@Body() dto: CreateDemoDto) {
    return { ok: true, dto };
  }
}
