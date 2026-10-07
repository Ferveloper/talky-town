import { Global, Module } from "@nestjs/common";
import { ApplicationClock } from "./application-clock";
import { PersistenceIds } from "./persistence-ids.service";
@Global()
@Module({
  providers: [ApplicationClock, PersistenceIds],
  exports: [ApplicationClock, PersistenceIds],
})
export class CommonModule {}
