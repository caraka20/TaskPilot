-- Per-user exception for Tuton mutations outside an active work session.
ALTER TABLE `User`
  ADD COLUMN `canEditTutonWithoutWork` BOOLEAN NOT NULL DEFAULT false;
