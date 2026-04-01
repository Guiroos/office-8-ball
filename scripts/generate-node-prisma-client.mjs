import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const schemaPath = resolve("prisma/schema.prisma");
const generatorName = "vercel_node_client";

async function generateNodePrismaClient() {
  const schemaContent = await readFile(schemaPath, "utf8");
  const tempDir = await mkdtemp(
    join(resolve("prisma"), ".tmp-node-prisma-client-"),
  );
  const tempSchemaPath = join(tempDir, "schema.prisma");

  try {
    const nodeGeneratorBlock = `
generator ${generatorName} {
  provider = "prisma-client-js"
}
`;

    await writeFile(
      tempSchemaPath,
      `${schemaContent.trimEnd()}\n${nodeGeneratorBlock}`,
      "utf8",
    );

    const result = spawnSync(
      "prisma",
      ["generate", "--schema", tempSchemaPath, "--generator", generatorName],
      {
        stdio: "inherit",
        env: process.env,
      },
    );

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

await generateNodePrismaClient();
