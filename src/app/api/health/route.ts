import { NextResponse } from "next/server";
import { db } from "@/server/db";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "up" | "down";
      latencyMs?: number;
      error?: string;
    };
    lightning: {
      status: "up" | "down" | "unknown";
      error?: string;
    };
  };
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const startTime = Date.now();
  const checks: HealthCheck["checks"] = {
    database: { status: "down" },
    lightning: { status: "unknown" },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = {
      status: "up",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  // Check Lightning/MDK connectivity
  // For now, we just verify the env vars are set
  // A more thorough check would create a test invoice
  try {
    const mdkToken = process.env.MDK_ACCESS_TOKEN;
    const mdkMnemonic = process.env.MDK_MNEMONIC;
    
    if (mdkToken && mdkMnemonic) {
      checks.lightning = { status: "up" };
    } else {
      checks.lightning = {
        status: "down",
        error: "MDK credentials not configured",
      };
    }
  } catch (error) {
    checks.lightning = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown lightning error",
    };
  }

  const allHealthy = 
    checks.database.status === "up" && 
    checks.lightning.status === "up";

  const response: HealthCheck = {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
  });
}
