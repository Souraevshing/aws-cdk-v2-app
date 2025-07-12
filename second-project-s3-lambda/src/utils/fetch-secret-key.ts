import {
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

// create a SecretsManagerClient reference to send the secret key
const secretsClient = new SecretsManagerClient({});

/**
 * @description fetch secret key from AWS SecretManager and return as string in the response
 * @param secretId secretKey
 * @returns secretKey as string
 */
export const fetchSecretKey = async (secretId: string): Promise<string> => {
  // create a GetSecretValueCommand reference and passing the secretId as argument to SecretId
  const command = new GetSecretValueCommand({
    SecretId: secretId,
  });

  // res to store the secretKey from SecretManager
  let res: GetSecretValueCommandOutput;

  try {
    // send command as argument to send function of SecretsManagerClient and assign it to the response
    res = await secretsClient.send(command);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error fetching secret key`, e.message);
      throw new Error(e.message);
    }
    throw new Error("Unknown error fetching secret key");
  }

  if (!res || !res.SecretString) {
    throw new Error("Secret value not found");
  }

  return res.SecretString;
};
