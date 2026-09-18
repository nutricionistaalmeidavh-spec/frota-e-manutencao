CREATE TABLE IF NOT EXISTS preventive_program (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS preventive_program_plan (
  program_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  PRIMARY KEY (program_id, plan_id)
);
