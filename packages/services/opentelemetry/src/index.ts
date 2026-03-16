import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { NodeSDK, logs, metrics } from "@opentelemetry/sdk-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter: new OTLPTraceExporter(),
  metricReader: new metrics.PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() }),
  logRecordProcessors: [new logs.BatchLogRecordProcessor(new OTLPLogExporter())],
});

sdk.start();
