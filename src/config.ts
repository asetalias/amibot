const getConfig = () => {
  const config = {
    port: parseInt(process.env.PORT || "3000"),
    mongoUrl: process.env.MONGO_URL || "",
    dbName: process.env.DB_NAME || "",
    userCollectionName: process.env.USER_COLLECTION_NAME || "",
    metaApiToken: process.env.META_API_TOKEN || "",
    webhookVerificationToken: process.env.WEBHOOK_VERIFICATION_TOKEN || "",
  };
  for (const [k, v] of Object.entries(config)) {
    if (v === undefined || v === "") {
      throw new Error(`no ${k}!`);
    }
  }

  return config;
};

export default getConfig;
