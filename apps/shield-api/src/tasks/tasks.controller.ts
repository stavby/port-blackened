import { Controller, Get, Param, Put } from "@nestjs/common";
import { ApiParam } from "@nestjs/swagger";
import { ObjectId } from "mongodb";
import { AuthenticatedUser } from "nest-keycloak-connect";
import { LoggedUser } from "src/auth/auth.interface";
import { ParseObjectIdPipe } from "src/utils/mongo.utils";
import { ActiveTaskDto } from "./tasks.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(@AuthenticatedUser() user: LoggedUser): Promise<ActiveTaskDto[]> {
    return await this.tasksService.getActiveTasks(user);
  }

  @Put("id/:id/done")
  @ApiParam({ name: "id", type: "string" })
  async markTaskAsDone(@Param("id", new ParseObjectIdPipe()) id: ObjectId, @AuthenticatedUser() user: LoggedUser): Promise<void> {
    this.tasksService.markTaskAsDone(id, user);
  }
}
