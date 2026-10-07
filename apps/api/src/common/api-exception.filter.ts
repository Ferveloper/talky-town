import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { ApiErrorResponse } from "@talkytown/shared";
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    let status = 500;
    let body: ApiErrorResponse = { code: "INTERNAL_ERROR" };
    if (error instanceof HttpException) {
      status = error.getStatus();
      const response = error.getResponse();
      body =
        typeof response === "object" && response !== null && "code" in response
          ? (response as ApiErrorResponse)
          : { code: status === 401 ? "UNAUTHORIZED" : "REQUEST_REJECTED" };
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      status = 503;
      body = { code: "DATABASE_UNAVAILABLE" };
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        status = 409;
        body = { code: "RESOURCE_CONFLICT" };
      }
      if (error.code === "P2025") {
        status = 404;
        body = { code: "RESOURCE_NOT_FOUND" };
      }
      if (["P1001", "P1002", "P2024"].includes(error.code)) {
        status = 503;
        body = { code: "DATABASE_UNAVAILABLE" };
      }
      if (error.code === "P2034") {
        status = 409;
        body = { code: "CONCURRENT_UPDATE" };
      }
    }
    host
      .switchToHttp()
      .getResponse<{ status(code: number): { json(value: unknown): void } }>()
      .status(status)
      .json(body);
  }
}
