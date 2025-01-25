package internal

import (
	"context"
	"fmt"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
)

const metricExportInterval = 10 * time.Second

func InitMetrics(ctx context.Context, config *Config) error {
	if config == nil || !config.ExportMetrics {
		// no metrics
		return nil
	}

	exporter, err := newMetricGrpcExporter(ctx)
	if err != nil {
		return fmt.Errorf("failed to initialize exporter: %w", err)
	}

	mp, err := newMeterProvider(exporter, config)
	if err != nil {
		return fmt.Errorf("failed to initialize metric provider: %w", err)
	}

	otel.SetMeterProvider(mp)
	return nil
}

func ShutdownMetrics(ctx context.Context) {
	mp, ok := otel.GetMeterProvider().(*sdkmetric.MeterProvider)
	if !ok {
		// mb metrics were not initialized
		return
	}
	// nothing to do with the error
	_ = mp.Shutdown(context.WithoutCancel(ctx))
}

func newMetricGrpcExporter(ctx context.Context) (sdkmetric.Exporter, error) {
	return otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithInsecure())
}

func newMeterProvider(exporter sdkmetric.Exporter, config *Config) (*sdkmetric.MeterProvider, error) {
	res, err := NewResource(config)
	if err != nil {
		return nil, err
	}

	return sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter,
			sdkmetric.WithInterval(metricExportInterval))),
		sdkmetric.WithResource(res),
	), nil
}
