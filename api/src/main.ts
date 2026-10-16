import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { getApiOverview } from "./common/openapi/api-overview";
import { AppConfig } from "./config/configuration";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger("Bootstrap");

  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Atlass Fin API")
    .setDescription(getApiOverview())
    .setVersion("0.1.0")
    .addTag(
      "auth",
      "Registro, inicio de sesión, renovación y cierre de sesión.",
    )
    .addTag("users", "Perfil y preferencias del usuario autenticado.")
    .addTag("reference", "Catálogos de referencia (monedas soportadas).")
    .addTag(
      "health",
      "Estado del servicio y conectividad con la base de datos.",
    )
    .addTag("accounts", "Cuentas y sus saldos actuales.")
    .addTag("categories", "Categorías de ingresos y gastos.")
    .addTag("transactions", "Ingresos, gastos y transferencias atómicas.")
    .addTag("budgets", "Presupuestos mensuales por categoría.")
    .addTag("assets", "Activos y su historial de valuaciones.")
    .addTag("debts", "Deudas y su vínculo opcional con un activo.")
    .addTag(
      "positions",
      "Posiciones de inversión y su valorización de mercado.",
    )
    .addTag("quotes", "Cotizaciones de cripto y su antigüedad.")
    .addTag("goals", "Objetivos de ahorro, progreso y estado.")
    .addTag("dashboard", "KPIs y series agregadas del período.")
    .addTag("reports", "Resúmenes, desgloses y exportación CSV.")
    .addTag("assistant", "Asistente IA: consultas, acciones y confirmaciones.")
    .addTag("market", "Refresco manual de cotizaciones y tipos de cambio.")
    .addCookieAuth("access_token")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
  });

  // Scalar renders the same OpenAPI document as an interactive reference.
  // The document is fetched from the JSON endpoint above, so `@nestjs/swagger`
  // stays the single source of truth for the contract.
  //
  // Scalar is loaded lazily on purpose: its transitive dependency
  // `@scalar/core` is ESM-only, and `require()`-ing it from this CommonJS
  // bundle fails on runtimes without `require(esm)` (ERR_REQUIRE_ESM), which
  // would crash the whole process at boot. A docs UI must never take the API
  // down, so on failure we log and keep the always-on Swagger UI at /api/docs.
  let scalarReferenceEnabled = false;
  try {
    const { apiReference } = await import("@scalar/nestjs-api-reference");
    app.use(
      "/api/reference",
      apiReference({
        url: "/api/docs-json",
        pageTitle: "Atlass Fin API Reference",
      }),
    );
    scalarReferenceEnabled = true;
  } catch (error) {
    logger.warn(
      `Scalar API reference disabled (${
        error instanceof Error ? error.message : String(error)
      }); use Swagger UI at /api/docs`,
    );
  }

  const port = config.get("port", { infer: true });
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
  if (scalarReferenceEnabled) {
    logger.log(
      `API reference (Scalar): http://localhost:${port}/api/reference`,
    );
  }
  logger.log(`OpenAPI document: http://localhost:${port}/api/docs-json`);
};

void bootstrap();
