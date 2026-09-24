import fs from "fs";
import os from "os";
import path from "path";


export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

/**
 * Writes a Config object to the JSON file after setting the current_user_name field.
 * @param userName
 */
export function setUser(userName: string) {
  const config = readConfig();
  config.currentUserName = userName;
  writeConfig(config);
}
/**
 * Reads the JSON file found at ~/.gatorconfig.json and returns a Config object.
 * It should read the file from the HOME directory, then decode the JSON string into
 * a new Config object.
 */
export function readConfig(): Config {
  const fullPath = getConfigFilePath();

  const data = fs.readFileSync(fullPath, "utf-8");
  const rawConfig = JSON.parse(data);

  return validateConfig(rawConfig);
}

function getConfigFilePath(): string {
  const homeDir = os.homedir();
  const configPath = path.join(homeDir, ".gatorconfig.json");
  return configPath;
}

type RawConfig = { db_url: string, current_user_name: string };
function writeConfig(config: Config): void {
  const configPath = getConfigFilePath();
  const rawConfig = { db_url: config.dbUrl, current_user_name: config.currentUserName };
  const rawConfigStr = JSON.stringify(rawConfig);
  fs.writeFileSync(configPath, rawConfigStr, {flush: true});
}

function validateConfig(rawConfig: any) {
  if (!rawConfig.db_url || typeof rawConfig.db_url !== "string") {
    throw new Error("db_url is required in config file");
  }
  const config: Config = {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name ?? "",
  };

  return config;
}
