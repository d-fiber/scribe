// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/observability/protocol/observability.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports
// ignore_for_file: unused_import

import 'dart:convert' as $convert;
import 'dart:core' as $core;
import 'dart:typed_data' as $typed_data;

import '../../../../../protocol/common.pbjson.dart' as $0;

@$core.Deprecated('Use spanKindDescriptor instead')
const SpanKind$json = {
  '1': 'SpanKind',
  '2': [
    {'1': 'SPAN_KIND_UNSPECIFIED', '2': 0},
    {'1': 'SPAN_KIND_INTERNAL', '2': 1},
    {'1': 'SPAN_KIND_CLIENT', '2': 2},
    {'1': 'SPAN_KIND_SERVER', '2': 3},
  ],
};

/// Descriptor for `SpanKind`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List spanKindDescriptor = $convert.base64Decode(
    'CghTcGFuS2luZBIZChVTUEFOX0tJTkRfVU5TUEVDSUZJRUQQABIWChJTUEFOX0tJTkRfSU5URV'
    'JOQUwQARIUChBTUEFOX0tJTkRfQ0xJRU5UEAISFAoQU1BBTl9LSU5EX1NFUlZFUhAD');

@$core.Deprecated('Use spanDescriptor instead')
const Span$json = {
  '1': 'Span',
  '2': [
    {'1': 'trace_id', '3': 1, '4': 1, '5': 9, '10': 'traceId'},
    {'1': 'span_id', '3': 2, '4': 1, '5': 9, '10': 'spanId'},
    {'1': 'parent_span_id', '3': 3, '4': 1, '5': 9, '10': 'parentSpanId'},
    {'1': 'name', '3': 4, '4': 1, '5': 9, '10': 'name'},
    {
      '1': 'kind',
      '3': 5,
      '4': 1,
      '5': 14,
      '6': '.scribe.clients.observability.v1.SpanKind',
      '10': 'kind'
    },
    {'1': 'started_at', '3': 6, '4': 1, '5': 3, '10': 'startedAt'},
    {'1': 'ended_at', '3': 7, '4': 1, '5': 3, '10': 'endedAt'},
    {
      '1': 'attributes',
      '3': 8,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'attributes'
    },
    {
      '1': 'error',
      '3': 9,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Failure',
      '10': 'error'
    },
  ],
};

/// Descriptor for `Span`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List spanDescriptor = $convert.base64Decode(
    'CgRTcGFuEhkKCHRyYWNlX2lkGAEgASgJUgd0cmFjZUlkEhcKB3NwYW5faWQYAiABKAlSBnNwYW'
    '5JZBIkCg5wYXJlbnRfc3Bhbl9pZBgDIAEoCVIMcGFyZW50U3BhbklkEhIKBG5hbWUYBCABKAlS'
    'BG5hbWUSPQoEa2luZBgFIAEoDjIpLnNjcmliZS5jbGllbnRzLm9ic2VydmFiaWxpdHkudjEuU3'
    'BhbktpbmRSBGtpbmQSHQoKc3RhcnRlZF9hdBgGIAEoA1IJc3RhcnRlZEF0EhkKCGVuZGVkX2F0'
    'GAcgASgDUgdlbmRlZEF0Ei8KCmF0dHJpYnV0ZXMYCCABKAsyDy5zY3JpYmUudjEuSnNvblIKYX'
    'R0cmlidXRlcxIoCgVlcnJvchgJIAEoCzISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use spanBatchDescriptor instead')
const SpanBatch$json = {
  '1': 'SpanBatch',
  '2': [
    {
      '1': 'spans',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.observability.v1.Span',
      '10': 'spans'
    },
  ],
};

/// Descriptor for `SpanBatch`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List spanBatchDescriptor = $convert.base64Decode(
    'CglTcGFuQmF0Y2gSOwoFc3BhbnMYASADKAsyJS5zY3JpYmUuY2xpZW50cy5vYnNlcnZhYmlsaX'
    'R5LnYxLlNwYW5SBXNwYW5z');

@$core.Deprecated('Use spanAckDescriptor instead')
const SpanAck$json = {
  '1': 'SpanAck',
};

/// Descriptor for `SpanAck`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List spanAckDescriptor =
    $convert.base64Decode('CgdTcGFuQWNr');

const $core.Map<$core.String, $core.dynamic> ObservabilityServiceBase$json = {
  '1': 'Observability',
  '2': [
    {
      '1': 'Ship',
      '2': '.scribe.clients.observability.v1.SpanBatch',
      '3': '.scribe.clients.observability.v1.SpanAck'
    },
  ],
};

@$core.Deprecated('Use observabilityServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    ObservabilityServiceBase$messageJson = {
  '.scribe.clients.observability.v1.SpanBatch': SpanBatch$json,
  '.scribe.clients.observability.v1.Span': Span$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.observability.v1.SpanAck': SpanAck$json,
};

/// Descriptor for `Observability`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List observabilityServiceDescriptor = $convert.base64Decode(
    'Cg1PYnNlcnZhYmlsaXR5ElwKBFNoaXASKi5zY3JpYmUuY2xpZW50cy5vYnNlcnZhYmlsaXR5Ln'
    'YxLlNwYW5CYXRjaBooLnNjcmliZS5jbGllbnRzLm9ic2VydmFiaWxpdHkudjEuU3BhbkFjaw==');
